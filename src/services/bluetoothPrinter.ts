/**
 * Bluetooth Thermal 58mm Printer Service (ESC/POS)
 * Supports direct Web Bluetooth printing to 58mm thermal printers (Panda, Iware, RPP02N, POS-58, GOOJPRT, MPT-II, dll.)
 */

import { Transaction, StoreSettings } from '../types';
import { formatRupiah, formatDateTime } from '../utils/format';

// Known Bluetooth Thermal Printer Service UUIDs
const KNOWN_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common Chinese BLE Thermal Printer (Panda, Iware, POS-58)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART (MPT-II, etc.)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;

const CMD_INIT = [ESC, 0x40]; // Initialize printer
const CMD_ALIGN_LEFT = [ESC, 0x61, 0x00];
const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01];
const CMD_ALIGN_RIGHT = [ESC, 0x61, 0x02];
const CMD_BOLD_ON = [ESC, 0x45, 0x01];
const CMD_BOLD_OFF = [ESC, 0x45, 0x00];
const CMD_SIZE_NORMAL = [GS, 0x21, 0x00];
const CMD_SIZE_DOUBLE_HEIGHT = [GS, 0x21, 0x01];
const CMD_SIZE_DOUBLE = [GS, 0x21, 0x11];
const CMD_FEED_4 = [ESC, 0x64, 0x04];

// Global cached connection
let connectedDevice: any = null;
let writeCharacteristic: any = null;

export const isBluetoothSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

export const getConnectedPrinterName = (): string | null => {
  if (connectedDevice && connectedDevice.gatt && connectedDevice.gatt.connected) {
    return connectedDevice.name || 'Printer Bluetooth 58mm';
  }
  return null;
};

export const disconnectBluetoothPrinter = async () => {
  try {
    if (connectedDevice && connectedDevice.gatt && connectedDevice.gatt.connected) {
      connectedDevice.gatt.disconnect();
    }
  } catch (err) {
    console.warn('Error disconnecting bluetooth printer:', err);
  } finally {
    connectedDevice = null;
    writeCharacteristic = null;
  }
};

/**
 * Connect to Bluetooth Thermal Printer using Web Bluetooth API
 */
export const connectBluetoothPrinter = async (): Promise<{ success: boolean; deviceName?: string; error?: string }> => {
  if (!isBluetoothSupported()) {
    return {
      success: false,
      error: 'Browser ini tidak mendukung Web Bluetooth. Gunakan Google Chrome atau Edge pada Android/PC/Mac.',
    };
  }

  try {
    // Request device
    const nav: any = navigator;
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        ...KNOWN_SERVICES,
        '0000180a-0000-1000-8000-00805f9b34fb', // Device Info
      ],
    });

    if (!device) {
      return { success: false, error: 'Tidak ada printer yang dipilih.' };
    }

    const server = await device.gatt.connect();

    // Find writable characteristic
    let foundChar: any = null;

    // First try known services
    for (const sUuid of KNOWN_SERVICES) {
      try {
        const service = await server.getPrimaryService(sUuid);
        if (service) {
          const chars = await service.getCharacteristics();
          for (const ch of chars) {
            if (ch.properties.write || ch.properties.writeWithoutResponse) {
              foundChar = ch;
              break;
            }
          }
        }
      } catch {
        // service not found, keep trying
      }
      if (foundChar) break;
    }

    // If still not found, enumerate all primary services
    if (!foundChar) {
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const chars = await service.getCharacteristics();
            for (const ch of chars) {
              if (ch.properties.write || ch.properties.writeWithoutResponse) {
                foundChar = ch;
                break;
              }
            }
          } catch {
            // characteristic search failed
          }
          if (foundChar) break;
        }
      } catch (err) {
        console.warn('Error fetching all services:', err);
      }
    }

    if (!foundChar) {
      device.gatt.disconnect();
      return {
        success: false,
        error: 'Printer terhubung tapi tidak ditemukan jalur tulis (characteristic write). Pastikan memilih printer thermal 58mm yang tepat.',
      };
    }

    connectedDevice = device;
    writeCharacteristic = foundChar;

    const deviceName = device.name || 'Printer Bluetooth 58mm';
    localStorage.setItem('pos_bt_printer_name', deviceName);

    // Listen to disconnect
    device.addEventListener('gattserverdisconnected', () => {
      connectedDevice = null;
      writeCharacteristic = null;
    });

    return { success: true, deviceName };
  } catch (err: any) {
    if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
      return { success: false, error: 'Pemilihan printer Bluetooth dibatalkan.' };
    }
    if (err.name === 'SecurityError' || err.message?.includes('permissions policy') || err.message?.includes('disallowed') || err.message?.includes('requestDevice')) {
      return {
        success: false,
        error: 'Akses Bluetooth dibatasi oleh Policy Preview Iframe. Silakan buka aplikasi pada tab browser mandiri (standalone) atau jendela terpisah untuk menghubungkan printer Bluetooth.',
      };
    }
    return {
      success: false,
      error: err.message || 'Gagal menyambungkan ke printer Bluetooth.',
    };
  }
};

/**
 * Format string row for 32 columns standard 58mm thermal paper
 */
export const format32ColRow = (left: string, right: string): string => {
  const TOTAL_WIDTH = 32;
  const leftClean = left.trim();
  const rightClean = right.trim();

  const totalLen = leftClean.length + rightClean.length;
  if (totalLen <= TOTAL_WIDTH) {
    const spaces = ' '.repeat(TOTAL_WIDTH - totalLen);
    return leftClean + spaces + rightClean + '\n';
  }

  // If too long, truncate left or put right on next line
  if (rightClean.length >= TOTAL_WIDTH) {
    return leftClean + '\n' + rightClean + '\n';
  }

  const allowedLeft = TOTAL_WIDTH - rightClean.length - 1;
  const truncatedLeft = leftClean.substring(0, allowedLeft);
  const spaces = ' '.repeat(TOTAL_WIDTH - truncatedLeft.length - rightClean.length);
  return truncatedLeft + spaces + rightClean + '\n';
};

/**
 * Send byte buffer to printer in chunks of 100 bytes
 */
const sendToPrinter = async (data: Uint8Array): Promise<void> => {
  if (!writeCharacteristic) {
    throw new Error('Printer Bluetooth belum terhubung.');
  }

  const CHUNK_SIZE = 100;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    if (writeCharacteristic.properties.writeWithoutResponse) {
      await writeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await writeCharacteristic.writeValue(chunk);
    }
    // Small delay between packets to prevent buffer overflow on low-cost Bluetooth thermal printers
    await new Promise((resolve) => setTimeout(resolve, 35));
  }
};

/**
 * Text encoder helper to ASCII / CP437
 */
const encodeText = (text: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(text);
};

/**
 * Build ESC/POS bytes for 58mm receipt
 */
export const buildReceiptEscPosData = (
  transaction: Transaction,
  settings: StoreSettings
): Uint8Array => {
  const parts: (number[] | Uint8Array)[] = [];

  // Init
  parts.push(CMD_INIT);

  // Center header
  parts.push(CMD_ALIGN_CENTER);
  parts.push(CMD_BOLD_ON);
  parts.push(CMD_SIZE_DOUBLE_HEIGHT);
  parts.push(encodeText((settings.namaToko || 'POS USAHA TERPADU').toUpperCase() + '\n'));

  parts.push(CMD_SIZE_NORMAL);
  parts.push(CMD_BOLD_OFF);
  if (settings.alamat) {
    parts.push(encodeText(settings.alamat + '\n'));
  }
  if (settings.noTelepon) {
    parts.push(encodeText('Telp: ' + settings.noTelepon + '\n'));
  }

  // Separator
  parts.push(encodeText('--------------------------------\n'));

  // Meta Left Align
  parts.push(CMD_ALIGN_LEFT);
  parts.push(encodeText(format32ColRow('No. Struk:', transaction.nomorStruk)));
  parts.push(encodeText(format32ColRow('Waktu:', formatDateTime(transaction.waktu))));
  parts.push(encodeText(format32ColRow('Kasir:', transaction.kasirName || 'Kasir')));
  if (transaction.namaPelanggan) {
    parts.push(encodeText(format32ColRow('Pelanggan:', transaction.namaPelanggan)));
  }
  parts.push(
    encodeText(
      format32ColRow(
        'Metode:',
        `${transaction.metodePembayaran.toUpperCase()} (${transaction.statusPembayaran.toUpperCase()})`
      )
    )
  );

  // Separator
  parts.push(encodeText('--------------------------------\n'));

  // Items
  for (const it of transaction.items) {
    // Item name
    parts.push(CMD_BOLD_ON);
    parts.push(encodeText(it.nama + '\n'));
    parts.push(CMD_BOLD_OFF);

    // Qty @ Price ... Subtotal
    const qtyPrice = `${it.qty} ${it.satuan || 'x'} @ ${formatRupiah(it.hargaJual)}`;
    const subtotal = formatRupiah(it.subtotal);
    parts.push(encodeText(format32ColRow(qtyPrice, subtotal)));
  }

  // Separator
  parts.push(encodeText('--------------------------------\n'));

  // Totals
  parts.push(CMD_BOLD_ON);
  parts.push(encodeText(format32ColRow('TOTAL BELANJA:', formatRupiah(transaction.totalJual))));
  parts.push(CMD_BOLD_OFF);

  if (transaction.statusPembayaran === 'sebagian') {
    parts.push(
      encodeText(
        format32ColRow(
          `Dibayar (${transaction.metodePembayaran.toUpperCase()}):`,
          formatRupiah(transaction.jumlahBayar || 0)
        )
      )
    );
    parts.push(
      encodeText(
        format32ColRow('Sisa Hutang:', formatRupiah(transaction.sisaHutang || 0))
      )
    );
  }

  const statusLabel =
    transaction.statusPembayaran === 'lunas'
      ? 'LUNAS'
      : transaction.statusPembayaran === 'sebagian'
      ? 'BAYAR SEBAGIAN'
      : 'HUTANG / KASBON';

  parts.push(encodeText(format32ColRow('Status Bayar:', statusLabel)));

  // Separator
  parts.push(encodeText('--------------------------------\n'));

  // Footer notes
  parts.push(CMD_ALIGN_CENTER);
  const footerNote = settings.catatanStruk || 'Terima kasih atas kunjungan Anda!';
  parts.push(encodeText(footerNote + '\n'));
  parts.push(encodeText('Simpan struk bukti pembayaran\n'));

  // Feed 4 lines so paper comes out of the tear bar
  parts.push(CMD_FEED_4);

  // Flatten array
  let totalLength = 0;
  for (const p of parts) {
    totalLength += p.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const p of parts) {
    if (p instanceof Uint8Array) {
      result.set(p, offset);
      offset += p.length;
    } else {
      result.set(new Uint8Array(p), offset);
      offset += p.length;
    }
  }

  return result;
};

/**
 * Print Transaction Receipt directly to Bluetooth 58mm Thermal Printer
 */
export const printReceiptBluetooth = async (
  transaction: Transaction,
  settings: StoreSettings
): Promise<{ success: boolean; error?: string }> => {
  try {
    // If not connected yet or connection dropped, prompt connect
    if (!connectedDevice || !connectedDevice.gatt || !connectedDevice.gatt.connected || !writeCharacteristic) {
      const conn = await connectBluetoothPrinter();
      if (!conn.success) {
        return { success: false, error: conn.error || 'Gagal menghubungkan printer Bluetooth.' };
      }
    }

    const receiptData = buildReceiptEscPosData(transaction, settings);
    await sendToPrinter(receiptData);

    return { success: true };
  } catch (err: any) {
    console.error('Error printing receipt via Bluetooth:', err);
    return {
      success: false,
      error: err.message || 'Gagal mengirim data cetak ke printer Bluetooth.',
    };
  }
};

/**
 * Test Print Slip for 58mm Bluetooth Thermal Printer
 */
export const testPrintBluetooth = async (
  settings: StoreSettings
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!connectedDevice || !connectedDevice.gatt || !connectedDevice.gatt.connected || !writeCharacteristic) {
      const conn = await connectBluetoothPrinter();
      if (!conn.success) {
        return { success: false, error: conn.error || 'Gagal menghubungkan printer Bluetooth.' };
      }
    }

    const parts: (number[] | Uint8Array)[] = [];
    parts.push(CMD_INIT);
    parts.push(CMD_ALIGN_CENTER);
    parts.push(CMD_BOLD_ON);
    parts.push(CMD_SIZE_DOUBLE_HEIGHT);
    parts.push(encodeText('UJI CETAK BLUETOOTH\n'));
    parts.push(CMD_SIZE_NORMAL);
    parts.push(CMD_BOLD_OFF);
    parts.push(encodeText((settings.namaToko || 'POS Usaha Terpadu') + '\n'));
    parts.push(encodeText('--------------------------------\n'));
    parts.push(CMD_ALIGN_LEFT);
    parts.push(encodeText(format32ColRow('Printer:', 'Thermal 58mm')));
    parts.push(encodeText(format32ColRow('Karakter:', '32 Kolom (ESC/POS)')));
    parts.push(encodeText(format32ColRow('Status:', 'OK - SIAP DIGUNAKAN')));
    parts.push(encodeText(format32ColRow('Waktu Tes:', new Date().toLocaleTimeString('id-ID'))));
    parts.push(encodeText('--------------------------------\n'));
    parts.push(CMD_ALIGN_CENTER);
    parts.push(encodeText('Koneksi Bluetooth Berhasil!\n'));
    parts.push(CMD_FEED_4);

    let totalLength = 0;
    for (const p of parts) totalLength += p.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const p of parts) {
      if (p instanceof Uint8Array) {
        result.set(p, offset);
        offset += p.length;
      } else {
        result.set(new Uint8Array(p), offset);
        offset += p.length;
      }
    }

    await sendToPrinter(result);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal melakukan uji cetak Bluetooth.' };
  }
};

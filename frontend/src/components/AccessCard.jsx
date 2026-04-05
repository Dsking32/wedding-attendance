import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const generateAccessCards = async (guests, onProgress) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 54]
  });

  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];

    if (i > 0) pdf.addPage([85, 54], 'landscape');

    // Background
    pdf.setFillColor(255, 252, 245);
    pdf.rect(0, 0, 85, 54, 'F');

    // Gold border
    pdf.setDrawColor(180, 146, 90);
    pdf.setLineWidth(0.8);
    pdf.rect(2, 2, 81, 50, 'D');

    // Inner thin border
    pdf.setDrawColor(210, 180, 120);
    pdf.setLineWidth(0.3);
    pdf.rect(3.5, 3.5, 78, 47, 'D');

    // Header background
    pdf.setFillColor(180, 146, 90);
    pdf.rect(2, 2, 81, 12, 'F');

    // Wedding title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ZAINAB & DESMOND', 42.5, 7.5, { align: 'center' });
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('WEDDING RECEPTION', 42.5, 11.5, { align: 'center' });

    // Guest name
    pdf.setTextColor(80, 50, 10);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    const name = guest.name.length > 28 ? guest.name.substring(0, 26) + '..' : guest.name;
    pdf.text(name, 42.5, 22, { align: 'center' });

    // Section/group
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(140, 100, 40);
    const section = guest.section || 'Guest';
    pdf.text(section.toUpperCase(), 42.5, 27, { align: 'center' });

    // Divider line
    pdf.setDrawColor(180, 146, 90);
    pdf.setLineWidth(0.3);
    pdf.line(10, 29, 75, 29);

    // QR Code
    try {
      const qrDataUrl = await QRCode.toDataURL(`${guest.qr_data}|${guest.pin}`, {
        width: 200,
        margin: 1,
        color: { dark: '#3d2600', light: '#FFFCF5' }
      });
      pdf.addImage(qrDataUrl, 'PNG', 5, 31, 20, 20);
    } catch (e) {
      console.error('QR error:', e);
    }

    // PIN label
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(140, 100, 40);
    pdf.text('ACCESS PIN', 38, 33, { align: 'left' });

    // PIN number
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 50, 10);
    pdf.text(guest.pin, 38, 41, { align: 'left' });

    // Footer
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(160, 120, 60);
    pdf.text('Present this card at the entrance', 42.5, 50, { align: 'center' });

    if (onProgress) onProgress(i + 1, guests.length);
  }

  return pdf;
};

export const downloadAllCards = async (guests, onProgress) => {
  const pdf = await generateAccessCards(guests, onProgress);
  pdf.save('Zainab-Desmond-Wedding-Access-Cards.pdf');
};

export const downloadSingleCard = async (guest) => {
  const pdf = await generateAccessCards([guest]);
  pdf.save(`Access-Card-${guest.name.replace(/\s+/g, '-')}.pdf`);
};
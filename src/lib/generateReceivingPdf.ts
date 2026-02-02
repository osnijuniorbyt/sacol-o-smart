import jsPDF from 'jspdf';
import { PurchaseOrder, ReceivingPhoto } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GeneratePdfOptions {
  order: PurchaseOrder;
  photos: ReceivingPhoto[];
}

export async function generateReceivingPdf({ order, photos }: GeneratePdfOptions): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Comprovante de Recebimento', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Order info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const supplierName = order.supplier?.name || 'Fornecedor não informado';
  doc.text(`Fornecedor: ${supplierName}`, margin, yPosition);
  yPosition += 8;

  if (order.received_at) {
    const receivedDate = format(new Date(order.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    doc.text(`Data do Recebimento: ${receivedDate}`, margin, yPosition);
    yPosition += 8;
  }

  const createdDate = format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR });
  doc.text(`Data do Pedido: ${createdDate}`, margin, yPosition);
  yPosition += 8;

  // Totals
  if (order.total_received !== null && order.total_received !== undefined) {
    doc.text(`Total Recebido: R$ ${order.total_received.toFixed(2)}`, margin, yPosition);
    yPosition += 8;
  }

  yPosition += 5;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Items section
  if (order.items && order.items.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Itens Recebidos', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    for (const item of order.items) {
      checkPageBreak(20);
      
      const productName = item.product?.name || 'Produto';
      const qtyReceived = item.quantity_received ?? item.estimated_kg;
      const unit = item.unit || 'kg';
      
      doc.text(`• ${productName}: ${qtyReceived} ${unit}`, margin + 5, yPosition);
      yPosition += 6;

      if (item.unit_cost_actual) {
        doc.setTextColor(100, 100, 100);
        doc.text(`  Custo: R$ ${item.unit_cost_actual.toFixed(2)}/${unit}`, margin + 10, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 6;
      }
    }

    yPosition += 5;
  }

  // Photos section
  if (photos.length > 0) {
    checkPageBreak(20);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fotos do Recebimento (${photos.length})`, margin, yPosition);
    yPosition += 15;

    // Load and add images
    const imageWidth = 80;
    const imageHeight = 60;
    const imagesPerRow = 2;
    const horizontalGap = 10;

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const col = i % imagesPerRow;
      const xPosition = margin + col * (imageWidth + horizontalGap);

      // Check if we need a new row
      if (col === 0 && i > 0) {
        yPosition += imageHeight + 15;
      }

      // Check page break
      if (col === 0) {
        checkPageBreak(imageHeight + 20);
      }

      try {
        // Load image as base64
        const response = await fetch(photo.photo_url);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        // Add image to PDF
        doc.addImage(base64, 'JPEG', xPosition, yPosition, imageWidth, imageHeight);
        
        // Add timestamp below image
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const timestamp = format(new Date(photo.captured_at), "dd/MM HH:mm", { locale: ptBR });
        doc.text(timestamp, xPosition + imageWidth / 2, yPosition + imageHeight + 5, { align: 'center' });
      } catch (error) {
        console.error('Error loading image:', error);
        // Draw placeholder if image fails to load
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(240, 240, 240);
        doc.rect(xPosition, yPosition, imageWidth, imageHeight, 'FD');
        doc.setFontSize(10);
        doc.text('Imagem indisponível', xPosition + imageWidth / 2, yPosition + imageHeight / 2, { align: 'center' });
      }
    }

    // Move yPosition after all images
    const totalRows = Math.ceil(photos.length / imagesPerRow);
    if (photos.length > 0 && photos.length % imagesPerRow !== 0) {
      yPosition += imageHeight + 15;
    } else if (totalRows > 0) {
      yPosition += imageHeight + 15;
    }
  }

  // Footer
  yPosition += 10;
  checkPageBreak(30);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  doc.text(`Documento gerado em: ${generatedAt}`, margin, yPosition);
  doc.text(`ID do Pedido: ${order.id}`, pageWidth - margin, yPosition, { align: 'right' });

  // Save the PDF
  const fileName = `recebimento_${order.supplier?.name?.replace(/\s+/g, '_') || 'pedido'}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
}

// Helper function to convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

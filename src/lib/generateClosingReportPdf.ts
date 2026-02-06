import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PurchaseOrder } from '@/types/database';

export async function generateClosingReportPdf(order: PurchaseOrder) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE FECHAMENTO', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);
  
  // Info do pedido
  doc.setFontSize(12);
  doc.text(`Fornecedor: ${order.supplier?.name || 'N/A'}`, 14, 40);
  doc.text(`Data do Pedido: ${format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 48);
  
  if (order.received_at) {
    doc.text(`Data Fechamento: ${format(new Date(order.received_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 56);
  }

  // Calcular dados dos itens
  const items = order.items || [];
  const tableData = items.map(item => {
    const product = item.product;
    const pesoBruto = item.estimated_kg || 1;
    const tara = item.tare_total || 0;
    const pesoLiquido = Math.max(0, pesoBruto - tara);
    const custoKg = item.unit_cost_actual || item.unit_cost_estimated || 0;
    const precoVenda = product?.price || 0;
    const margem = custoKg > 0 && precoVenda > custoKg 
      ? ((1 - custoKg / precoVenda) * 100).toFixed(1) + '%'
      : '-';
    
    return [
      product?.name || 'Produto',
      `${(item.quantity_received || item.quantity)} ${item.unit}`,
      `${pesoLiquido.toFixed(1)} kg`,
      `R$ ${custoKg.toFixed(2)}`,
      `R$ ${precoVenda.toFixed(2)}`,
      margem,
    ];
  });

  // Tabela de itens
  autoTable(doc, {
    head: [['Produto', 'Volumes', 'Peso Líq.', 'Custo/kg', 'Venda/kg', 'Margem']],
    body: tableData,
    startY: 68,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 197, 94] },
    columnStyles: {
      0: { cellWidth: 50 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  // Totais
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Calcular totais
  const totalPesoLiquido = items.reduce((sum, i) => {
    const pesoBruto = i.estimated_kg || 1;
    const tara = i.tare_total || 0;
    return sum + Math.max(0, pesoBruto - tara);
  }, 0);
  
  const totalCusto = order.total_received || order.total_estimated;
  
  // Calcular margem média ponderada
  let totalPesoComMargem = 0;
  let somaMargemPonderada = 0;
  items.forEach(item => {
    const product = item.product;
    if (!product) return;
    const custo = item.unit_cost_actual || item.unit_cost_estimated || 0;
    const preco = product.price || 0;
    const pesoBruto = item.estimated_kg || 1;
    const tara = item.tare_total || 0;
    const pesoLiquido = Math.max(0, pesoBruto - tara);
    
    if (custo > 0 && preco > custo) {
      const margem = (1 - custo / preco) * 100;
      somaMargemPonderada += margem * pesoLiquido;
      totalPesoComMargem += pesoLiquido;
    }
  });
  const margemMedia = totalPesoComMargem > 0 ? somaMargemPonderada / totalPesoComMargem : 0;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO', 14, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Peso Líquido Total: ${totalPesoLiquido.toFixed(1)} kg`, 14, finalY + 8);
  doc.text(`Custo Total: R$ ${totalCusto.toFixed(2)}`, 14, finalY + 16);
  doc.text(`Margem Média Ponderada: ${margemMedia.toFixed(1)}%`, 14, finalY + 24);

  // Notas se houver
  if (order.notes) {
    doc.text(`Observações: ${order.notes}`, 14, finalY + 36);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Página ${i} de ${pageCount} - Horti Campos`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Salvar
  const fileName = `fechamento-${order.supplier?.name?.replace(/\s+/g, '-').toLowerCase() || 'pedido'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

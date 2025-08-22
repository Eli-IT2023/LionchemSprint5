import { jsPDF } from "jspdf";

const generatePDF = (historyItem, settings) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Set default font
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  // ========================
  // Header Section
  // ========================
  const logoImage = settings?.logo || "";
  const logoHeight = 35;
  const logoWidth = 40;
  const logoX = 7;
  const logoY = 12;

  if (logoImage) {
    doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight);
  }

  // Company Info Container (60% width)
  const containerWidth = 110;
  const containerStartX = 42;
  let currentY = 20;

  // Company Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${settings.company_name}`, containerStartX, currentY);
  currentY += 7;

  // Contact Info with semi-bold labels
  const lineHeight = 5;
  const labelValuePairs = [
    { label: "Address:", value: settings.company_address },
    { label: "Telephone:", value: settings.landline },
    { label: "Email:", value: settings.email },
  ];

  doc.setFontSize(10);

  labelValuePairs.forEach((pair) => {
    // Draw label in semi-bold
    doc.setFont("helvetica", "bold");
    const labelText = pair.label;
    doc.text(labelText, containerStartX, currentY);

    // Get label width
    const labelWidth = doc.getTextWidth(labelText);

    // Draw value in normal weight
    doc.setFont("helvetica", "normal");

    // Split long text into multiple lines
    const maxWidth = containerWidth - labelWidth - 2;
    const lines = doc.splitTextToSize(pair.value || "N/A", maxWidth);

    lines.forEach((line, i) => {
      doc.text(
        line,
        containerStartX + labelWidth + 2,
        currentY + i * lineHeight
      );
    });

    currentY += lines.length * lineHeight;
  });

  // ========================
  // Date Information (40% width)
  // ========================

  const dateInfoStartX = 180;
  const dateLabelY = 27;
  const dateValueY = 27;
  const dateSpacing = 5;

  // Date Received
  doc.setFont("helvetica", "bold");
  doc.text("Date Received: ", dateInfoStartX, dateLabelY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(
    historyItem.details.createdAt
      ? new Date(historyItem.details.createdAt).toLocaleDateString("en-US")
      : "N/A",
    dateInfoStartX,
    dateValueY
    // { align: "right" }
  );

  // P.O Request Date
  doc.setFont("helvetica", "bold");
  doc.text("P.O Request Date: ", dateInfoStartX, dateLabelY + dateSpacing, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.text(
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_pr_id?.createdAt
      ? new Date(
          historyItem.details.rh_receiving_id.receiving_po_id.po_pr_id.createdAt
        ).toLocaleDateString("en-US")
      : "N/A",
    dateInfoStartX,
    dateValueY + dateSpacing
    // { align: "right" }
  );

  // ========================
  // Divider Line (dynamic position)
  // ========================
  const dividerY = Math.max(currentY, 45) + 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, dividerY, 195, dividerY);

  // ========================
  // Report Title
  // ========================
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("P.O Receiving Report", 15, dividerY + 10);

  // ========================
  // Vendor Information (with bold labels)
  // ========================
  doc.setFontSize(10);

  // Left-aligned fields
  const vendor =
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_vendor;
  const vendorName =
    vendor?.fname && vendor?.lname
      ? `${vendor.fname} ${vendor.lname}`
      : vendor?.company_name || "N/A";

  // Vendor Name
  doc.setFont("helvetica", "bold");
  doc.text("Vendor Name:", 15, dividerY + 20);
  doc.setFont("helvetica", "normal");
  doc.text(
    vendorName,
    15 + doc.getTextWidth("Vendor Name: ") + 2,
    dividerY + 20
  );

  // PO Number
  doc.setFont("helvetica", "bold");
  doc.text("P.O Number:", 15, dividerY + 25);
  doc.setFont("helvetica", "normal");
  doc.text(
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_number || "N/A",
    15 + doc.getTextWidth("P.O Number: ") + 2,
    dividerY + 25
  );

  // Duty & Customs
  doc.setFont("helvetica", "bold");
  doc.text("Duty & Customs:", 15, dividerY + 30);
  doc.setFont("helvetica", "normal");
  doc.text(
    (parseFloat(historyItem.details.duty_custom) || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    15 + doc.getTextWidth("Duty & Customs: ") + 2,
    dividerY + 30
  );

  // Shipping Fee
  doc.setFont("helvetica", "bold");
  doc.text("Shipping Fee:", 15, dividerY + 35);
  doc.setFont("helvetica", "normal");
  doc.text(
    (parseFloat(historyItem.details.shipping_fee) || 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ),
    15 + doc.getTextWidth("Shipping Fee: ") + 2,
    dividerY + 35
  );

  // Received By and Requestor
  const receivedBy = historyItem.details.rh_received_by;
  const receivedByName =
    receivedBy?.fname && receivedBy?.lname
      ? `${receivedBy.fname} ${receivedBy.lname}`
      : "N/A";

  const requestor =
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_pr_id?.requestor;
  const requestorName =
    requestor?.fname && requestor?.lname
      ? `${requestor.fname} ${requestor.lname}`
      : "N/A";

  doc.text(`Received By: ${receivedByName}`, 193, dividerY + 20, {
    align: "right",
  });
  doc.text(`Requestor: ${requestorName}`, 193, dividerY + 25, {
    align: "right",
  });

  // ========================
  // Products Table using autoTable
  // ========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Receiving Report No: ${historyItem.details.rr_no || "N/A"}`,
    15,
    dividerY + 47
  );

  // Prepare table data
  const tableData =
    historyItem.details?.receiving_product_orders?.length > 0
      ? historyItem.details.receiving_product_orders.map((product) => [
          product.rpo_vendor_product_id?.po_vendor_product_id?.product_code ||
            "N/A",
          product.rpo_vendor_product_id?.po_vendor_product_id?.product_name ||
            "N/A",
          product.rpo_vendor_product_id?.po_vendor_product_id?.prod_packaging
            ?.packaging_name || "N/A",
          (
            parseFloat(product.rpo_vendor_product_id?.price) || 0
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          (parseFloat(product.quantity_received) || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          product.rpo_vendor_product_id?.remarks || "",
        ])
      : [["No products received in this transaction", "", "", "", "", ""]];

  // Generate the table
  doc.autoTable({
    startY: dividerY + 52,
    head: [
      [
        "PRODUCT CODE",
        "PRODUCT NAME",
        "UOM",
        "UNIT PRICE",
        "QTY RECEIVED",
        "REMARKS",
      ],
    ],
    body: tableData,
    headStyles: {
      fillColor: [219, 223, 228],
      textColor: [41, 41, 42],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      font: "helvetica",
      cellPadding: 2,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 35 }, // PRODUCT CODE
      1: { cellWidth: 35 }, // PRODUCT NAME
      2: { cellWidth: 20 }, // UOM
      3: { cellWidth: 25 }, // UNIT PRICE
      4: { cellWidth: 25 }, // QTY RECEIVED
      5: { cellWidth: "auto" }, // REMARKS
    },
    margin: { left: 15 },
    didDrawPage: function (data) {
      // Add "Continued" text if this is a subsequent page
      if (data.pageCount > 1 && data.pageNumber > 1) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("PRODUCTS RECEIVED (Continued)", 15, 20);
      }
    },
  });

  // ========================
  // Save PDF
  // ========================
  const poNumber =
    historyItem.details.rh_receiving_id?.receiving_po_id?.po_number || "report";
  const now = new Date();
  const date = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "-");

  const fileName = `${poNumber}-${date}-Receiving-Report.pdf`;
  doc.save(fileName);
};

export default generatePDF;

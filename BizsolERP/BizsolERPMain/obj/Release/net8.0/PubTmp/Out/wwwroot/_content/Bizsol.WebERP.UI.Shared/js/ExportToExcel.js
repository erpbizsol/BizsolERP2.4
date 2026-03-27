const ExportToExcelControl = {
    ExportToExcel: function ExportToExcel(ExcelExportDataArray, hiddenFields = [], fileName = "ExportData") {
        // 1. Validate input data
        if (!Array.isArray(ExcelExportDataArray) || ExcelExportDataArray.length === 0) {
            alert("No data to export.");
            return;
        }

        // 2. Prepare export data by excluding hidden fields
        const exportData = ExcelExportDataArray.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                if (!hiddenFields.includes(key)) {
                    newRow[key] = row[key];
                }
            });
            return newRow;
        });

        // 3. Create worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        // 4. Export Excel file
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
}   

export { ExportToExcelControl }




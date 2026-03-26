# MachineMaintenance Backend API Implementation Guide

यह guide आपको बताता है कि MachineMaintenance API में image data को कैसे handle करना है।

## GetMachineMaintenanceByCode API में Image Return करना

आपके `GetMachineMaintenanceByCode` API method में image data को return करने के लिए निम्नलिखित code add करें:

### C# Backend Example:

```csharp
[HttpGet]
[Route("GetMachineMaintenanceByCode")]
public IActionResult GetMachineMaintenanceByCode(int Code)
{
    try
    {
        // Your existing code to get machine maintenance data
        var machineMaintenance = _repository.GetMachineMaintenanceByCode(Code);
        
        if (machineMaintenance == null)
        {
            return Ok(new { Status = "N", Msg = "Record not found" });
        }
        
        // Get image data from database (assuming it's stored in another table/database)
        var imageData = GetImageDataFromDatabase(machineMaintenance.Code);
        
        // Prepare response with image data
        var response = new
        {
            Code = machineMaintenance.Code,
            EntryNo = machineMaintenance.EntryNo,
            EntryDate = machineMaintenance.EntryDate,
            RequestDate = machineMaintenance.RequestDate,
            MachineNo = machineMaintenance.MachineNo,
            DepartmentName = machineMaintenance.DepartmentName,
            Status = machineMaintenance.Status,
            MachineFailedDate = machineMaintenance.MachineFailedDate,
            MachineFailedTime = machineMaintenance.MachineFailedTime,
            JobAssignedTo = machineMaintenance.JobAssignedTo,
            ReasonName = machineMaintenance.ReasonName,
            FailedRemark = machineMaintenance.FailedRemark,
            UpdatedByName = machineMaintenance.UpdatedByName,
            WorkStartDate = machineMaintenance.WorkStartDate,
            WorkStartTime = machineMaintenance.WorkStartTime,
            DescriptionofWorkDone = machineMaintenance.DescriptionofWorkDone,
            StartRemark = machineMaintenance.StartRemark,
            
            // Image data from DocumentMaster table - यहाँ image data add करें
            DocumentContent = imageData?.ImageBytes ?? new byte[0],  // Byte array (DocumentMaster.DocumentContent)
            DocumentName = imageData?.FileName ?? "",                // File name (DocumentMaster.DocumentName)
            // Alternative field names (अगर पुराने code के साथ compatibility चाहिए):
            attachData = imageData?.ImageBytes ?? new byte[0],
            attachFileName = imageData?.FileName ?? ""
        };
        
        return Ok(new[] { response });
    }
    catch (Exception ex)
    {
        return Ok(new { Status = "N", Msg = ex.Message });
    }
}

// Helper method to get image from DocumentMaster table (दूसरे database से)
private ImageDataModel GetImageDataFromDatabase(int machineMaintenanceCode)
{
    // SQL Query - DocumentMaster table से data fetch करें
    // आपके INSERT query के according SELECT query:
    // INSERT में: MasterTableName='MachineMaintenanceRequestDetails', MasterTableCode=@NewCode
    // SELECT में: same conditions use करें
    
    try
    {
        // Method 1: Using Entity Framework (अगर same database में है)
        var documentRecord = _dbContext.DocumentMaster
            .Where(x => x.MasterTableName == "MachineMaintenanceRequestDetails" 
                     && x.MasterTableCode == machineMaintenanceCode
                     && x.LinkedWith == "M")  // INSERT query में LinkedWith='M' है
            .OrderByDescending(x => x.Code)  // Latest record लेने के लिए
            .FirstOrDefault();
        
        if (documentRecord != null && documentRecord.DocumentContent != null)
        {
            return new ImageDataModel
            {
                ImageBytes = documentRecord.DocumentContent,  // VARBINARY(MAX) से byte[]
                FileName = documentRecord.DocumentName
            };
        }
        
        // Method 2: Using Raw SQL (अगर DocumentMaster दूसरे database में है)
        // आपके INSERT query के according SELECT query:
        // INSERT में: @DMSDBName use हो रहा है, same यहाँ भी use करें
        
        // Option A: Fixed Database Name
        string dmsDbName = "YourDMSDatabaseName"; // यहाँ DMS database name set करें
        var sql = $@"
            SELECT TOP 1
                DocumentContent,
                DocumentName,
                DocumentParticulars,
                EntryNo,
                EntryDate
            FROM [{dmsDbName}]..DocumentMaster
            WHERE MasterTableName = 'MachineMaintenanceRequestDetails'
              AND MasterTableCode = @Code
              AND LinkedWith = 'M'
            ORDER BY Code DESC";
        
        // Option B: Dynamic Database Name (Configuration से)
        // string dmsDbName = _configuration["DatabaseSettings:DMSDatabaseName"];
        // var sql = $@"
        //     SELECT TOP 1
        //         DocumentContent,
        //         DocumentName
        //     FROM [{dmsDbName}]..DocumentMaster
        //     WHERE MasterTableName = 'MachineMaintenanceRequestDetails'
        //       AND MasterTableCode = @Code
        //       AND LinkedWith = 'M'
        //     ORDER BY Code DESC";
        
        // Option C: Using sp_executesql (जैसा आपके INSERT query में है)
        // var sql = $@"
        //     DECLARE @DMSDBName VARCHAR(100) = '{dmsDbName}'
        //     DECLARE @SqlQuery NVARCHAR(MAX) = '
        //         SELECT TOP 1
        //             DocumentContent,
        //             DocumentName
        //         FROM ' + @DMSDBName + '..DocumentMaster
        //         WHERE MasterTableName = ''MachineMaintenanceRequestDetails''
        //           AND MasterTableCode = @Code
        //           AND LinkedWith = ''M''
        //         ORDER BY Code DESC
        //     '
        //     EXEC sp_executesql @SqlQuery, N'@Code INT', @Code = {machineMaintenanceCode}";
        
        var parameters = new SqlParameter("@Code", machineMaintenanceCode);
        var result = _dbContext.Database
            .SqlQueryRaw<DocumentMasterResult>(sql, parameters)
            .FirstOrDefault();
        
        if (result != null && result.DocumentContent != null && result.DocumentContent.Length > 0)
        {
            return new ImageDataModel
            {
                ImageBytes = result.DocumentContent,
                FileName = result.DocumentName ?? ""
            };
        }
        
        return null;
    }
    catch (Exception ex)
    {
        // Log error
        Console.WriteLine($"Error fetching image: {ex.Message}");
        return null;
    }
}

// Model classes
public class ImageDataModel
{
    public byte[] ImageBytes { get; set; }
    public string FileName { get; set; }
}

// SQL Query Result Model (Raw SQL के लिए)
public class DocumentMasterResult
{
    public byte[] DocumentContent { get; set; }
    public string DocumentName { get; set; }
    public string DocumentParticulars { get; set; }
    public int? EntryNo { get; set; }
    public DateTime? EntryDate { get; set; }
}
```

## SaveMachineMaintenance API में Image Save करना

आपके `SaveMachineMaintenance` API method में image data को save करने के लिए:

```csharp
[HttpPost]
[Route("SaveMachineMaintenance")]
public IActionResult SaveMachineMaintenance([FromBody] List<MachineMaintenanceRequestModel> requestData)
{
    try
    {
        if (requestData == null || requestData.Count == 0)
        {
            return Ok(new { Status = "N", Msg = "Invalid request data" });
        }
        
        var data = requestData[0];
        
        // Save main machine maintenance record
        var machineMaintenance = new MachineMaintenance
        {
            Code = data.Code,
            EntryNo = data.EntryNo,
            EntryDate = data.EntryDate,
            // ... other fields
        };
        
        _repository.SaveMachineMaintenance(machineMaintenance);
        
        // Save/Update image data to DocumentMaster table
        if (data.attachData != null && data.attachData.Length > 0)
        {
            // Convert List<int> to byte[] if needed
            byte[] imageBytes = data.attachData is List<int> 
                ? ((List<int>)data.attachData).Select(x => (byte)x).ToArray()
                : (byte[])data.attachData;
            
            SaveOrUpdateImageData(machineMaintenance.Code, imageBytes, data.attachFileName);
        }
        
        return Ok(new { Status = "Y", Msg = "Saved successfully" });
    }
    catch (Exception ex)
    {
        return Ok(new { Status = "N", Msg = ex.Message });
    }
}

// Helper method to save or update image in DocumentMaster table
private void SaveOrUpdateImageData(int machineMaintenanceCode, byte[] imageData, string fileName)
{
    try
    {
        // Get DMS database name (same as INSERT query में use हो रहा है)
        string dmsDbName = "YourDMSDatabaseName"; // या _configuration["DatabaseSettings:DMSDatabaseName"]
        string companyCode = "YourCompanyCode"; // या request से get करें
        int userMasterCode = 1; // या request से get करें
        int entryNo = GetNextEntryNo(machineMaintenanceCode); // EntryNo calculate करें
        
        // Check if image already exists (for update case)
        var existingImage = _dbContext.Database
            .SqlQueryRaw<DocumentMasterResult>($@"
                SELECT TOP 1 Code, DocumentContent, DocumentName
                FROM [{dmsDbName}]..DocumentMaster
                WHERE MasterTableName = 'MachineMaintenanceRequestDetails'
                  AND MasterTableCode = @Code
                  AND LinkedWith = 'M'
                ORDER BY Code DESC",
                new SqlParameter("@Code", machineMaintenanceCode))
            .FirstOrDefault();
        
        if (existingImage != null && existingImage.Code > 0)
        {
            // Update existing image
            var updateSql = $@"
                UPDATE [{dmsDbName}]..DocumentMaster
                SET DocumentContent = @DocumentContent,
                    DocumentName = @DocumentName,
                    UploadedOn = GETDATE(),
                    UploadedBy = @UserMasterCode,
                    Remarks = 'ID No. ' + CAST(@EntryNo AS VARCHAR) + ' Verified',
                    EntryNo = @EntryNo,
                    EntryDate = GETDATE()
                WHERE Code = @DocumentCode";
            
            var updateParams = new[]
            {
                new SqlParameter("@DocumentContent", imageData),
                new SqlParameter("@DocumentName", fileName ?? ""),
                new SqlParameter("@UserMasterCode", userMasterCode),
                new SqlParameter("@EntryNo", entryNo),
                new SqlParameter("@DocumentCode", existingImage.Code)
            };
            
            _dbContext.Database.ExecuteSqlRaw(updateSql, updateParams);
        }
        else
        {
            // Insert new image (जैसा आपका original INSERT query है)
            var insertSql = $@"
                INSERT INTO [{dmsDbName}]..DocumentMaster
                (
                    DocumentParticulars, DocumentName, FixedParameterMaster_Code,
                    MasterTableName, DetailTableName, MasterTableCode, DetailTableCode,
                    DocumentContent, UploadedOn, UploadedBy, LinkedWith,
                    Remarks, EntryNo, EntryDate
                )
                VALUES
                (
                    'MRM',
                    @DocumentName,
                    @CompanyCode,
                    'MachineMaintenanceRequestDetails',
                    '',
                    @MasterTableCode,
                    0,
                    @DocumentContent,
                    GETDATE(),
                    @UserMasterCode,
                    'M',
                    'ID No. ' + CAST(@EntryNo AS VARCHAR) + ' Verified',
                    @EntryNo,
                    GETDATE()
                )";
            
            var insertParams = new[]
            {
                new SqlParameter("@DocumentName", fileName ?? ""),
                new SqlParameter("@CompanyCode", companyCode),
                new SqlParameter("@MasterTableCode", machineMaintenanceCode),
                new SqlParameter("@DocumentContent", imageData),
                new SqlParameter("@UserMasterCode", userMasterCode),
                new SqlParameter("@EntryNo", entryNo)
            };
            
            _dbContext.Database.ExecuteSqlRaw(insertSql, insertParams);
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error saving/updating image: {ex.Message}");
        throw;
    }
}

// Helper method to get next EntryNo
private int GetNextEntryNo(int machineMaintenanceCode)
{
    // यहाँ आप EntryNo calculate करें
    // Example: MachineMaintenanceRequestDetails table से latest EntryNo + 1
    // या आपका existing logic use करें
    return 1; // Placeholder
}
```

## Request Model

```csharp
public class MachineMaintenanceRequestModel
{
    public int Code { get; set; }
    public int EntryNo { get; set; }
    public string EntryDate { get; set; }
    public string RequestDate { get; set; }
    public string MachineMaster_Code { get; set; }
    public string DepartmentMaster_Code { get; set; }
    public string Status { get; set; }
    public string MachineFailedDate { get; set; }
    public string MachineFailedTime { get; set; }
    public string JobAssignedTo { get; set; }
    public string ReasonMaster_Code { get; set; }
    public string FailedRemark { get; set; }
    public string WorkStartDate { get; set; }
    public string WorkStartTime { get; set; }
    public string DescriptionofWorkDone { get; set; }
    public string StartRemark { get; set; }
    
    // Image fields
    public string attachFileName { get; set; }
    public byte[] attachData { get; set; }  // या List<int> attachData { get; set; }
    
    public string companyCode { get; set; }
    public string UserMaster_Code { get; set; }
}
```

## Important Notes:

1. **Image Data Format**: Frontend से `attachData` एक byte array (List<int>) के रूप में आता है, जिसे आप C# में `byte[]` में convert कर सकते हैं:
   ```csharp
   byte[] imageBytes = requestData[0].attachData.Select(x => (byte)x).ToArray();
   ```

2. **Database Storage**: Image data को database में store करते समय:
   - SQL Server में `varbinary(MAX)` या `image` data type use करें
   - या separate file storage system use करें और path store करें

3. **Response Format**: Frontend निम्नलिखित formats को handle कर सकता है:
   - `attachData` (byte array)
   - `ImageData` (byte array)
   - `ImageDataBase64` (base64 string)
   - `DocumentContent` (byte array)

4. **Performance**: बड़ी images के लिए:
   - Compression use करें
   - या image को base64 string के रूप में return करें (frontend automatically handle करेगा)

## Database Schema Example:

```sql
-- Main table
CREATE TABLE MachineMaintenance (
    Code INT PRIMARY KEY,
    EntryNo INT,
    EntryDate DATETIME,
    -- other fields
)

-- Image attachment table (separate database या same database)
CREATE TABLE MachineMaintenanceAttachment (
    Code INT PRIMARY KEY IDENTITY,
    MachineMaintenance_Code INT,
    AttachFileName NVARCHAR(255),
    AttachData VARBINARY(MAX),
    CreatedDate DATETIME,
    FOREIGN KEY (MachineMaintenance_Code) REFERENCES MachineMaintenance(Code)
)
```

## Testing:

1. **Get API Test**: 
   - API call करें और check करें कि `attachData` और `attachFileName` return हो रहे हैं
   
2. **Save API Test**:
   - Image के साथ data save करें
   - Database में check करें कि image properly save हुआ है
   
3. **Edit Flow Test**:
   - Record edit करें
   - Check करें कि existing image display हो रहा है
   - नया image select करें और save करें
   - Verify करें कि नया image save हुआ है

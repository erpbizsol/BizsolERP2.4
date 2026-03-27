# MachineMaintenance SQL Queries

## SELECT Query - DocumentMaster से Image Fetch करने के लिए

आपके INSERT query के according SELECT query:

### Query 1: Same Database में (अगर DocumentMaster same database में है)

```sql
SELECT TOP 1
    DocumentContent,
    DocumentName,
    DocumentParticulars,
    EntryNo,
    EntryDate,
    Code
FROM DocumentMaster
WHERE MasterTableName = 'MachineMaintenanceRequestDetails'
  AND MasterTableCode = @Code  -- MachineMaintenanceRequestDetails का Code
  AND LinkedWith = 'M'
ORDER BY Code DESC
```

### Query 2: Different Database में (Dynamic Database Name)

```sql
-- Dynamic database name के साथ
DECLARE @DMSDBName VARCHAR(100) = 'YourDMSDatabaseName'  -- यहाँ DMS database name
DECLARE @Code INT = 2  -- MachineMaintenanceRequestDetails Code

DECLARE @SqlQuery NVARCHAR(MAX) = '
    SELECT TOP 1
        DocumentContent,
        DocumentName,
        DocumentParticulars,
        EntryNo,
        EntryDate,
        Code
    FROM ' + @DMSDBName + '..DocumentMaster
    WHERE MasterTableName = ''MachineMaintenanceRequestDetails''
      AND MasterTableCode = ' + CAST(@Code AS VARCHAR) + '
      AND LinkedWith = ''M''
    ORDER BY Code DESC
';

EXEC sp_executesql @SqlQuery
```

### Query 3: JOIN के साथ (MachineMaintenanceRequestDetails के साथ)

```sql
SELECT TOP 1
    MMRD.Code AS MachineMaintenanceCode,
    DM.DocumentContent,
    DM.DocumentName,
    DM.DocumentParticulars,
    DM.EntryNo,
    DM.EntryDate
FROM MachineMaintenanceRequestDetails MMRD
LEFT JOIN DocumentMaster DM 
    ON DM.MasterTableCode = MMRD.Code
   AND DM.MasterTableName = 'MachineMaintenanceRequestDetails'
   AND DM.LinkedWith = 'M'
WHERE MMRD.Code = @Code
ORDER BY DM.Code DESC
```

### Query 4: Different Database में JOIN के साथ

```sql
DECLARE @DMSDBName VARCHAR(100) = 'YourDMSDatabaseName'
DECLARE @Code INT = 2

SELECT TOP 1
    MMRD.Code AS MachineMaintenanceCode,
    DM.DocumentContent,
    DM.DocumentName,
    DM.DocumentParticulars,
    DM.EntryNo,
    DM.EntryDate
FROM MachineMaintenanceRequestDetails MMRD
LEFT JOIN [YourDMSDatabaseName]..DocumentMaster DM 
    ON DM.MasterTableCode = MMRD.Code
   AND DM.MasterTableName = 'MachineMaintenanceRequestDetails'
   AND DM.LinkedWith = 'M'
WHERE MMRD.Code = @Code
ORDER BY DM.Code DESC
```

## INSERT Query (Reference के लिए)

आपका original INSERT query:

```sql
SET @SqLQuery = '
    INSERT INTO ' + @DMSDBName + '..DocumentMaster
    (
        DocumentParticulars, DocumentName, FixedParameterMaster_Code,
        MasterTableName, DetailTableName, MasterTableCode, DetailTableCode,
        DocumentContent, UploadedOn, UploadedBy, LinkedWith,
        Remarks, EntryNo, EntryDate
    )
    SELECT
        ''MRM'',
        ''' + @AttachFileName + ''',
        ' + CAST(@CompanyCode AS VARCHAR) + ',
        ''MachineMaintenanceRequestDetails'',
        '''',
        ' + CAST(@NewCode AS VARCHAR) + ',
        0,
        ImgData,
        GETDATE(),
        ' + CAST(@UserMaster_Code AS VARCHAR) + ',
        ''M'',
        ''ID No. ' + CAST(@NextEntryNo AS VARCHAR) + ' Verified'',
        ' + CAST(@NextEntryNo AS VARCHAR) + ',
        GETDATE()
    FROM #MachineMaintenanceImgAttachDataTable
';
EXEC (@SqLQuery);
```

## Important Points:

1. **MasterTableName**: `'MachineMaintenanceRequestDetails'` (INSERT में जैसा है)
2. **MasterTableCode**: MachineMaintenanceRequestDetails का Code
3. **LinkedWith**: `'M'` (INSERT में जैसा है)
4. **DocumentParticulars**: `'MRM'` (INSERT में जैसा है)
5. **TOP 1**: Latest record लेने के लिए (ORDER BY Code DESC के साथ)

## C# Backend में Use करने के लिए:

```csharp
// Method 1: Entity Framework
var documentRecord = _dbContext.DocumentMaster
    .Where(x => x.MasterTableName == "MachineMaintenanceRequestDetails" 
             && x.MasterTableCode == machineMaintenanceCode
             && x.LinkedWith == "M")
    .OrderByDescending(x => x.Code)
    .FirstOrDefault();

// Method 2: Raw SQL
string sql = @"
    SELECT TOP 1
        DocumentContent,
        DocumentName
    FROM [YourDMSDatabaseName]..DocumentMaster
    WHERE MasterTableName = 'MachineMaintenanceRequestDetails'
      AND MasterTableCode = @Code
      AND LinkedWith = 'M'
    ORDER BY Code DESC";
```

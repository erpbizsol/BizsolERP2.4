# MachineMaintenance Stored Procedure Fix

## Error:
```
"Cannot drop the table '#Machin at Line No. 64"
```

## Problem:
Stored procedure में `#MachineMaintenanceRequestImgAttachDataTable` table को drop करने से पहले existence check नहीं हो रही है।

## Solution:

### Fixed UPDATE Query:

```sql
IF (@Code > 0)
BEGIN
    -- Update MachineMaintenanceRequestDetails
    UPDATE MachineMaintenanceRequestDetails 
    SET EntryNo = Tempdata.EntryNo,
        EntryDate = Tempdata.EntryDate,
        RequestDate = Tempdata.RequestDate,
        MachineMaster_Code = Tempdata.MachineMaster_Code,
        DepartmentMaster_Code = Tempdata.DepartmentMaster_Code,
        Status = Tempdata.Status,
        MachineFailedDate = CASE 
            WHEN Tempdata.MachineFailedDate IS NOT NULL AND Tempdata.MachineFailedTime IS NOT NULL
            THEN CAST(CONVERT(date, Tempdata.MachineFailedDate) AS datetime)
                + CAST(CONVERT(time, Tempdata.MachineFailedTime) AS datetime)
            ELSE NULL
        END,
        JobAssignedTo = Tempdata.JobAssignedTo,
        ReasonMaster_Code = Tempdata.ReasonMaster_Code,
        FailedRemark = Tempdata.FailedRemark,
        StartRemark = Tempdata.StartRemark,
        WorkStartDate = CASE 
            WHEN Tempdata.WorkStartDate IS NOT NULL AND Tempdata.WorkStartTime IS NOT NULL
            THEN CAST(CONVERT(date, Tempdata.WorkStartDate) AS datetime)
                + CAST(CONVERT(time, Tempdata.WorkStartTime) AS datetime)
            ELSE NULL
        END,
        DescriptionofWorkDone = Tempdata.DescriptionofWorkDone,
        FinYear = @FinYear,
        UpdatedBy = @UserMaster_Code,
        UpdateOn = GETDATE()
    FROM MachineMaintenanceRequestDetails 
    INNER JOIN @MachineMaintenanceRequestDetailsType AS Tempdata 
        ON Tempdata.code = MachineMaintenanceRequestDetails.Code

    -- FIX: Check if table exists before dropping
    IF OBJECT_ID('tempdb..#MachineMaintenanceRequestImgAttachDataTable') IS NOT NULL
    BEGIN
        DROP TABLE #MachineMaintenanceRequestImgAttachDataTable
    END

    -- Create temp table for image data
    CREATE TABLE #MachineMaintenanceRequestImgAttachDataTable 
    (
        Code int identity(1,1), 
        ImgData VARBINARY(MAX)  -- Changed from Image to VARBINARY(MAX)
    )

    -- Insert image data if provided
    IF @AttachData IS NOT NULL
    BEGIN
        DELETE FROM #MachineMaintenanceRequestImgAttachDataTable
        INSERT INTO #MachineMaintenanceRequestImgAttachDataTable (ImgData) 
        VALUES (@AttachData)

        -- Update image in DocumentMaster
        SET @SqLQuery = '
            UPDATE ' + QUOTENAME(@DMSDBName) + '..DocumentMaster
            SET
                DocumentName = ''' + @AttachFileName + ''',
                FixedParameterMaster_Code = ' + CAST(@CompanyCode AS VARCHAR) + ',
                DocumentContent = T.ImgData,
                UploadedOn = GETDATE(),
                UploadedBy = ' + CAST(@UserMaster_Code AS VARCHAR) + ',
                Remarks = ''ID No. ' + CAST(@NextEntryNo AS VARCHAR) + ' Updated''
            FROM ' + QUOTENAME(@DMSDBName) + '..DocumentMaster DM
            INNER JOIN #MachineMaintenanceRequestImgAttachDataTable T ON 1 = 1
            WHERE DM.MasterTableName = ''MachineMaintenanceRequestDetails''
              AND DM.MasterTableCode = ' + CAST(@Code AS VARCHAR) + '
              AND DM.LinkedWith = ''M''
        '
        EXEC (@SqLQuery)
    END

    SET @Status = 'Y'
    SET @Msg = 'Data updated successfully.'
END
```

## Key Changes:

1. **Table Existence Check**: 
   ```sql
   IF OBJECT_ID('tempdb..#MachineMaintenanceRequestImgAttachDataTable') IS NOT NULL
   BEGIN
       DROP TABLE #MachineMaintenanceRequestImgAttachDataTable
   END
   ```

2. **Data Type Fix**: 
   - Changed `ImgData Image` to `ImgData VARBINARY(MAX)`
   - `Image` data type is deprecated in SQL Server

3. **Code Casting**: 
   - Changed `@Code` to `CAST(@Code AS VARCHAR)` in dynamic SQL

4. **Remarks Fix**: 
   - Changed `'Updated'` to `' Updated'` (space added)

## Alternative Solution (If table might not exist):

```sql
-- Option 1: Use TRY-CATCH
BEGIN TRY
    IF OBJECT_ID('tempdb..#MachineMaintenanceRequestImgAttachDataTable') IS NOT NULL
        DROP TABLE #MachineMaintenanceRequestImgAttachDataTable
END TRY
BEGIN CATCH
    -- Table doesn't exist, continue
END CATCH

-- Option 2: Always create fresh (safer)
IF OBJECT_ID('tempdb..#MachineMaintenanceRequestImgAttachDataTable') IS NOT NULL
    DROP TABLE #MachineMaintenanceRequestImgAttachDataTable

CREATE TABLE #MachineMaintenanceRequestImgAttachDataTable 
(
    Code int identity(1,1), 
    ImgData VARBINARY(MAX)
)
```

## Complete Fixed Stored Procedure Section:

```sql
IF (@Code > 0)
BEGIN
    -- Update main table
    UPDATE MachineMaintenanceRequestDetails 
    SET EntryNo = Tempdata.EntryNo,
        EntryDate = Tempdata.EntryDate,
        RequestDate = Tempdata.RequestDate,
        MachineMaster_Code = Tempdata.MachineMaster_Code,
        DepartmentMaster_Code = Tempdata.DepartmentMaster_Code,
        Status = Tempdata.Status,
        MachineFailedDate = CASE 
            WHEN Tempdata.MachineFailedDate IS NOT NULL AND Tempdata.MachineFailedTime IS NOT NULL
            THEN CAST(CONVERT(date, Tempdata.MachineFailedDate) AS datetime)
                + CAST(CONVERT(time, Tempdata.MachineFailedTime) AS datetime)
            ELSE NULL
        END,
        JobAssignedTo = Tempdata.JobAssignedTo,
        ReasonMaster_Code = Tempdata.ReasonMaster_Code,
        FailedRemark = Tempdata.FailedRemark,
        StartRemark = Tempdata.StartRemark,
        WorkStartDate = CASE 
            WHEN Tempdata.WorkStartDate IS NOT NULL AND Tempdata.WorkStartTime IS NOT NULL
            THEN CAST(CONVERT(date, Tempdata.WorkStartDate) AS datetime)
                + CAST(CONVERT(time, Tempdata.WorkStartTime) AS datetime)
            ELSE NULL
        END,
        DescriptionofWorkDone = Tempdata.DescriptionofWorkDone,
        FinYear = @FinYear,
        UpdatedBy = @UserMaster_Code,
        UpdateOn = GETDATE()
    FROM MachineMaintenanceRequestDetails 
    INNER JOIN @MachineMaintenanceRequestDetailsType AS Tempdata 
        ON Tempdata.code = MachineMaintenanceRequestDetails.Code

    -- Handle image update
    IF @AttachData IS NOT NULL AND LEN(@AttachData) > 0
    BEGIN
        -- Drop temp table if exists
        IF OBJECT_ID('tempdb..#MachineMaintenanceRequestImgAttachDataTable') IS NOT NULL
            DROP TABLE #MachineMaintenanceRequestImgAttachDataTable

        -- Create temp table
        CREATE TABLE #MachineMaintenanceRequestImgAttachDataTable 
        (
            Code int identity(1,1), 
            ImgData VARBINARY(MAX)
        )

        -- Insert image data
        INSERT INTO #MachineMaintenanceRequestImgAttachDataTable (ImgData) 
        VALUES (@AttachData)

        -- Update DocumentMaster
        SET @SqLQuery = '
            UPDATE ' + QUOTENAME(@DMSDBName) + '..DocumentMaster
            SET
                DocumentName = ''' + REPLACE(@AttachFileName, '''', '''''') + ''',
                FixedParameterMaster_Code = ' + CAST(@CompanyCode AS VARCHAR) + ',
                DocumentContent = T.ImgData,
                UploadedOn = GETDATE(),
                UploadedBy = ' + CAST(@UserMaster_Code AS VARCHAR) + ',
                Remarks = ''ID No. ' + CAST(@NextEntryNo AS VARCHAR) + ' Updated''
            FROM ' + QUOTENAME(@DMSDBName) + '..DocumentMaster DM
            INNER JOIN #MachineMaintenanceRequestImgAttachDataTable T ON 1 = 1
            WHERE DM.MasterTableName = ''MachineMaintenanceRequestDetails''
              AND DM.MasterTableCode = ' + CAST(@Code AS VARCHAR) + '
              AND DM.LinkedWith = ''M''
        '
        EXEC (@SqLQuery)
    END

    SET @Status = 'Y'
    SET @Msg = 'Data updated successfully.'
END
```

## Additional Improvements:

1. **SQL Injection Protection**: Use `REPLACE(@AttachFileName, '''', '''''')` for file name
2. **Null Check**: Added `LEN(@AttachData) > 0` check
3. **Error Handling**: Consider adding TRY-CATCH block

## Testing:

1. Test with existing image update
2. Test with new image upload
3. Test without image (should not error)
4. Test with special characters in file name

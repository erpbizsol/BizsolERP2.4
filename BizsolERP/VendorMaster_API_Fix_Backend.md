# VendorMaster API – Bank & Contact Person Binding Fix

## Problem
`GetSolarVendorMasterByCode` returns `VendorMaster` correctly, but `BankAccountDetail` and `AccountContactPersonDetail` show empty values even though the database has data.

## Root Cause
The stored procedure returns **3 result sets** in this order:
1. **Result Set 1** → `VendorMaster` (AccountMaster)
2. **Result Set 2** → `BankAccountDetail`
3. **Result Set 3** → `AccountContactPersonDetail`

**The C# code was reading them in the WRONG order** (AccountContactPersonDetail before BankAccountDetail), causing Dapper to map wrong columns to wrong models → empty values.

## Solution
Read the result sets in the **same order** as the stored procedure returns them:
1. VendorMaster
2. **BankAccountDetail** (2nd)
3. **AccountContactPersonDetail** (3rd)

---

## C# API Controller Fix

Find your VendorMaster API controller (e.g. `VendorMasterApiController.cs` or similar) and update `GetSolarVendorMasterByCode` like this:

```csharp
[HttpGet("GetSolarVendorMasterByCode")]
public IActionResult GetSolarVendorMasterByCode(int Code)
{
    try
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            using (var cmd = new SqlCommand("USP_WebAPI_SolarVendorMaster", connection))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Code", Code);
                cmd.Parameters.AddWithValue("@Mode", "SHOWDATA");
                cmd.Parameters.AddWithValue("@UserMaster_Code", 0);
                cmd.Parameters.AddWithValue("@ReasonForDelete", "");
                cmd.Parameters.AddWithValue("@MainDBName", "");
                cmd.Parameters.AddWithValue("@Location", "");
                cmd.Parameters.AddWithValue("@IP", "");
                cmd.Parameters.AddWithValue("@QueryCondition", "");
                cmd.Parameters.AddWithValue("@OtherParameter", "");
                // Keep your existing @AccountMaster TVP (empty for SHOWDATA)
                cmd.Parameters.Add("@Status", SqlDbType.Char, 1).Direction = ParameterDirection.Output;
                cmd.Parameters.Add("@Msg", SqlDbType.VarChar, 2000).Direction = ParameterDirection.Output;

                var list1 = new List<Dictionary<string, object>>();
                var list2 = new List<Dictionary<string, object>>();
                var list3 = new List<Dictionary<string, object>>();

                using (var reader = cmd.ExecuteReader())
                {
                    // Result Set 1: VendorMaster
                    while (reader.Read())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                            row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        list1.Add(row);
                    }

                    // Result Set 2: BankAccountDetail
                    if (reader.NextResult())
                        while (reader.Read())
                        {
                            var row = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                            list2.Add(row);
                        }

                    // Result Set 3: AccountContactPersonDetail
                    if (reader.NextResult())
                        while (reader.Read())
                        {
                            var row = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                            list3.Add(row);
                        }
                }

                return Ok(new { VendorMaster = list1, BankAccountDetail = list2, AccountContactPersonDetail = list3 });
            }
        }
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { Status = "N", Msg = ex.Message });
    }
}
```

---

## Alternative: If Using Dapper (CORRECT ORDER)

**IMPORTANT:** Read result sets in the SAME order as the stored procedure returns them!

```csharp
public async Task<VW_SolarVendorMaster> GetSolarVendorMasterByCode(BizsolERPConnectionDetails _BizsolERPConnectionDetails, int Code)
{
    using (IDbConnection conn = new SqlConnection(_BizsolERPConnectionDetails.ERPDBConStr))
    {
        string sp_name = "USP_WebAPI_SolarVendorMaster";
        VW_SolarVendorMaster vM_SolarVendorMaster = new VW_SolarVendorMaster();
        DynamicParameters parameters = new DynamicParameters();
        parameters.Add("Code", Code);
        parameters.Add("Mode", "SHOWDATA");
        using (var multi = await conn.QueryMultipleAsync(sp_name, parameters, commandType: CommandType.StoredProcedure))
        {
            // ORDER MUST MATCH stored procedure result sets:
            // 1. VendorMaster, 2. BankAccountDetail, 3. AccountContactPersonDetail
            vM_SolarVendorMaster.VendorMaster = (await multi.ReadAsync<TY_SolarVendorMaster>()).ToList();
            vM_SolarVendorMaster.BankAccountDetail = (await multi.ReadAsync<TY_BankAccountDetail>()).ToList();      // 2nd
            vM_SolarVendorMaster.AccountContactPersonDetail = (await multi.ReadAsync<TY_AccountContactPersonDetail>()).ToList();  // 3rd
        }
        return vM_SolarVendorMaster;
    }
}
```

**Wrong order (causes empty data):**
```csharp
// WRONG - AccountContactPersonDetail and BankAccountDetail are swapped!
vM_SolarVendorMaster.AccountContactPersonDetail = (await multi.ReadAsync<TY_AccountContactPersonDetail>()).ToList();  // reads Bank data
vM_SolarVendorMaster.BankAccountDetail = (await multi.ReadAsync<TY_BankAccountDetail>()).ToList();  // reads Contact data
```

---

## Property Names

Ensure these match your C# models:

| SQL Column        | C# / JSON Property |
|-------------------|--------------------|
| `AccountMaster_Code` | `AccountMaster_Code` |
| `ContactPersonName`  | `ContactPersonName`  |
| `ContactPersonDesignation` | `ContactPersonDesignation` |
| `ContactPersonMobile` | `ContactPersonMobile` |
| `ContactPersonEMail` | `ContactPersonEMail` |
| `BankName`         | `BankName`         |
| `Address`          | `Address`          |
| `AccountNo`        | `AccountNo`        |
| `BeneficiaryCode`  | `BeneficiaryCode`  |
| `IFSCCode`         | `IFSCCode`         |
| `Refrence`         | `Refrence`         |

---

## Debug

1. Open browser **F12 → Console**
2. Click **Edit** on a vendor
3. Check console for: `EditVendor: BankDetail count=X, ContactDetail count=Y`
4. If both are **0**, the issue is in the backend – API is not returning the 2nd and 3rd result sets correctly

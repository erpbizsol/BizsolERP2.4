namespace BizsolERPMain.Models
{
    public class AuthKeySession
    {
        public string ERPDBConStr { get; set; }
        public string ERPMainDBConStr { get; set; }
        public string ERPDMSDBConStr { get; set; }
        public string ERPDB_Name { get; set; }
        public string ERPMainDB_Name { get; set; }
        public string ERPDMSDB_Name { get; set; }
        public string AuthToken { get; set; }
        public string CompanyCode { get; set; }
        public string UserMaster_Code { get; set; }
        public string CrystalReportBaseUrl { get; set; }
    }
}

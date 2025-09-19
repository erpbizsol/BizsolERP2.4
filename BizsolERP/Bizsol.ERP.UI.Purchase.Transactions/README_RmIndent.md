# Raw Material Indent Management System

## Overview
This document describes the implementation of the Raw Material Indent Management system for the ERP Purchase Transactions module. The system provides comprehensive CRUD operations for managing raw material indents with status tracking and approval workflows.

## Architecture

### Components Created

#### 1. Controller
- **File**: `Areas/PurchaseTransactions/Controllers/RmIndentController.cs`
- **Purpose**: Handles HTTP requests and routes to appropriate views
- **Actions**: Index, Create, Edit, Details, Delete

#### 2. Service Layer
- **File**: `Bizsol.WebERP.UI.Shared/wwwroot/js/JSServices/RmIndentService.js`
- **Purpose**: Handles API communication and data operations
- **Features**: CRUD operations, status management, search functionality

#### 3. Views
- **Index.cshtml**: Main grid view with filtering and search capabilities
- **Create.cshtml**: Form for creating new indents
- **Edit.cshtml**: Form for editing existing indents
- **Details.cshtml**: Read-only view of indent details
- **Delete.cshtml**: Confirmation page for deletion

#### 4. JavaScript
- **File**: `wwwroot/Script/RmIndent.js`
- **Purpose**: Client-side logic, validation, and UI interactions

## Features

### Data Fields
The system manages the following fields for each indent:
- **Indent No**: Unique identifier for the indent
- **Indent Date**: Date when the indent was created
- **Item Name**: Name of the raw material item
- **Size**: Physical dimensions of the item
- **Thickness**: Thickness specification
- **Grade**: Quality grade of the material
- **Make**: Manufacturer information
- **QTY PC**: Quantity in pieces
- **QTY MT**: Quantity in metric tons
- **QTY MTRS**: Quantity in meters
- **Remark**: Additional notes or comments
- **Source**: Source of the material
- **Status**: Current status (Pending, Purchased, Reject)
- **Purchased Date**: Date when the material was purchased

### Status Management
The system supports three main statuses:
- **Pending**: Newly created indents awaiting approval
- **Purchased**: Indents that have been fulfilled
- **Reject**: Indents that have been rejected

### Grid Features
- **Status Differentiation**: Visual color coding for different statuses
- **Filtering**: Filter by status using dropdown
- **Search**: Real-time search across multiple fields
- **Sorting**: Sortable columns for better data organization
- **Pagination**: Handles large datasets efficiently

### CRUD Operations
- **Create**: Add new indents with validation
- **Read**: View indent details and history
- **Update**: Edit existing indents
- **Delete**: Remove indents with confirmation

### Additional Features
- **Approval Workflow**: Approve or reject pending indents
- **History Tracking**: View complete audit trail
- **Bulk Operations**: Mark multiple indents as purchased
- **Export Capabilities**: Ready for data export functionality

## Validation Rules

### Client-Side Validation
- **Required Fields**: Indent No, Indent Date, Item Name
- **Date Validation**: Indent date cannot be in the future
- **Quantity Validation**: At least one quantity must be greater than zero
- **Format Validation**: Indent number format validation
- **Negative Values**: Quantities cannot be negative

### Server-Side Validation
- **Data Integrity**: Ensures data consistency
- **Business Rules**: Enforces business logic constraints
- **Security**: Validates user permissions and data access

## Error Handling

### Client-Side Error Handling
- **Network Errors**: Graceful handling of connection issues
- **Validation Errors**: Clear error messages with field highlighting
- **Retry Mechanism**: Automatic retry for failed requests
- **User Feedback**: Toast notifications for all operations

### Server-Side Error Handling
- **API Errors**: Proper HTTP status codes
- **Database Errors**: Transaction rollback and error logging
- **Security Errors**: Authentication and authorization checks

## API Endpoints

The service layer expects the following API endpoints:
- `GET /RmIndent/GetAllIndents` - Retrieve all indents
- `GET /RmIndent/GetIndentById/{id}` - Get specific indent
- `GET /RmIndent/GetIndentsByStatus/{status}` - Filter by status
- `POST /RmIndent/CreateIndent` - Create new indent
- `PUT /RmIndent/UpdateIndent/{id}` - Update existing indent
- `DELETE /RmIndent/DeleteIndent/{id}` - Delete indent
- `POST /RmIndent/ApproveIndent/{id}` - Approve indent
- `POST /RmIndent/RejectIndent/{id}` - Reject indent
- `POST /RmIndent/MarkAsPurchased/{id}` - Mark as purchased
- `GET /RmIndent/GetIndentHistory/{id}` - Get history
- `POST /RmIndent/SearchIndents` - Search indents

## Security Considerations

### Authentication
- User authentication required for all operations
- Session-based authentication using existing ERP system

### Authorization
- Role-based access control
- Group-level permissions for approval operations
- Audit trail for all modifications

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection through proper encoding

## Performance Optimizations

### Client-Side
- Lazy loading of data
- Efficient DOM manipulation
- Debounced search functionality
- Pagination for large datasets

### Server-Side
- Database indexing on frequently queried fields
- Caching of reference data
- Optimized queries with proper joins
- Connection pooling

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features with fallbacks
- Responsive design for mobile devices

## Dependencies
- jQuery 3.x
- Bootstrap 4.x
- Toastr for notifications
- Custom ERP shared components
- BizsolCustomFilterGrid for data display

## Installation and Setup

1. **Controller Registration**: The controller is automatically registered with the area routing
2. **Service Integration**: The service is added to the shared library
3. **View Registration**: Views are placed in the appropriate area structure
4. **JavaScript Integration**: Scripts are loaded via module imports

## Usage

### Accessing the System
Navigate to: `/PurchaseTransactions/RmIndent/Index`

### Creating New Indents
1. Click "Create New Indent" button
2. Fill in required fields
3. Validate and save

### Managing Existing Indents
1. Use the grid to view all indents
2. Filter by status if needed
3. Use action buttons for specific operations
4. View details, edit, or delete as needed

### Approval Workflow
1. Filter for "Pending" status
2. Review indent details
3. Approve or reject with reason
4. Track status changes in history

## Maintenance

### Regular Tasks
- Monitor system performance
- Review error logs
- Update validation rules as needed
- Backup data regularly

### Troubleshooting
- Check browser console for JavaScript errors
- Verify API endpoint availability
- Review server logs for backend issues
- Test with different user roles

## Future Enhancements

### Planned Features
- Bulk import/export functionality
- Advanced reporting capabilities
- Email notifications for status changes
- Mobile app integration
- Advanced search with filters
- Dashboard analytics

### Technical Improvements
- Implement caching layer
- Add unit tests
- Performance monitoring
- Automated backup system
- API versioning

## Support

For technical support or questions about this implementation:
1. Check the error logs first
2. Review this documentation
3. Contact the development team
4. Submit issues through the project management system

## Version History

- **v1.0**: Initial implementation with basic CRUD operations
- **v1.1**: Added validation and error handling
- **v1.2**: Enhanced UI with status differentiation
- **v1.3**: Added approval workflow and history tracking

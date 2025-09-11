export const typeDefs = `#graphql
  scalar Date
  scalar JSON

  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    department: String
    avatar: String
    createdAt: Date!
    updatedAt: Date!
  }

  enum UserRole {
    ADMIN
    MANAGER
    EMPLOYEE
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Fabric {
    id: ID!
    fabricId: String!
    type: String!
    color: String!
    quantity: Float!
    unit: String!
    location: String!
    supplier: String
    purchaseDate: Date
    price: Float
    qrCode: String!
    status: FabricStatus!
    lastUpdated: Date!
    history: [FabricHistory!]!
  }

  enum FabricStatus {
    IN_STOCK
    IN_USE
    LOW_STOCK
    OUT_OF_STOCK
  }

  type FabricHistory {
    action: String!
    quantity: Float!
    user: String!
    timestamp: Date!
    notes: String
  }

  type Product {
    id: ID!
    productId: String!
    name: String!
    category: String!
    design: String
    size: String
    quantity: Int!
    fabricUsed: [FabricUsage!]!
    manufacturingDate: Date
    completionDate: Date
    status: ProductStatus!
    qrCode: String!
    price: Float
    images: [String!]
  }

  enum ProductStatus {
    DESIGNING
    CUTTING
    STITCHING
    FINISHING
    QUALITY_CHECK
    COMPLETED
    DELIVERED
  }

  type FabricUsage {
    fabricId: String!
    quantity: Float!
    unit: String!
  }

  type Employee {
    id: ID!
    employeeId: String!
    name: String!
    position: String!
    department: String!
    email: String!
    phone: String!
    joinDate: Date!
    status: EmployeeStatus!
    skills: [String!]!
    attendance: [Attendance!]!
    performance: EmployeePerformance
  }

  enum EmployeeStatus {
    ACTIVE
    ON_LEAVE
    TERMINATED
  }

  type Attendance {
    date: Date!
    checkIn: Date
    checkOut: Date
    status: AttendanceStatus!
    overtime: Float
  }

  enum AttendanceStatus {
    PRESENT
    ABSENT
    LATE
    HALF_DAY
    HOLIDAY
  }

  type EmployeePerformance {
    rating: Float!
    tasksCompleted: Int!
    efficiency: Float!
    lastReview: Date
  }

  type Manufacturing {
    id: ID!
    orderId: String!
    productId: String!
    quantity: Int!
    startDate: Date!
    expectedCompletion: Date!
    actualCompletion: Date
    assignedTo: [String!]!
    status: ManufacturingStatus!
    stages: [ManufacturingStage!]!
    qrCode: String!
  }

  enum ManufacturingStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    DELAYED
    CANCELLED
  }

  type ManufacturingStage {
    name: String!
    status: String!
    startTime: Date
    endTime: Date
    assignedTo: String
    notes: String
  }

  type Dashboard {
    totalFabrics: Int!
    totalProducts: Int!
    activeEmployees: Int!
    pendingOrders: Int!
    lowStockItems: [Fabric!]!
    recentActivities: [Activity!]!
    productionStats: ProductionStats!
    inventoryValue: Float!
  }

  type Activity {
    id: ID!
    type: String!
    description: String!
    user: String!
    timestamp: Date!
    metadata: JSON
  }

  type ProductionStats {
    daily: Int!
    weekly: Int!
    monthly: Int!
    efficiency: Float!
  }

  type Query {
    # Auth
    me: User

    # Users
    users(role: UserRole): [User!]!
    user(id: ID!): User

    # Fabrics
    fabrics(status: FabricStatus, search: String): [Fabric!]!
    fabric(id: ID!): Fabric
    fabricByQR(qrCode: String!): Fabric

    # Products
    products(status: ProductStatus, category: String, search: String): [Product!]!
    product(id: ID!): Product
    productByQR(qrCode: String!): Product

    # Employees
    employees(department: String, status: EmployeeStatus): [Employee!]!
    employee(id: ID!): Employee
    employeeAttendance(employeeId: ID!, startDate: Date, endDate: Date): [Attendance!]!

    # Manufacturing
    manufacturingOrders(status: ManufacturingStatus): [Manufacturing!]!
    manufacturingOrder(id: ID!): Manufacturing

    # Dashboard
    dashboard: Dashboard!

    # Reports
    inventoryReport(startDate: Date!, endDate: Date!): JSON!
    productionReport(startDate: Date!, endDate: Date!): JSON!
    employeeReport(employeeId: ID, startDate: Date!, endDate: Date!): JSON!
  }

  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    updatePassword(oldPassword: String!, newPassword: String!): User!

    # Fabrics
    createFabric(input: FabricInput!): Fabric!
    updateFabric(id: ID!, input: FabricInput!): Fabric!
    updateFabricStock(id: ID!, quantity: Float!, action: String!, notes: String): Fabric!
    deleteFabric(id: ID!): Boolean!

    # Products
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    updateProductStatus(id: ID!, status: ProductStatus!): Product!
    deleteProduct(id: ID!): Boolean!

    # Employees
    createEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: EmployeeInput!): Employee!
    markAttendance(employeeId: ID!, status: AttendanceStatus!, checkIn: Date, checkOut: Date): Attendance!
    deleteEmployee(id: ID!): Boolean!

    # Manufacturing
    createManufacturingOrder(input: ManufacturingInput!): Manufacturing!
    updateManufacturingOrder(id: ID!, input: ManufacturingInput!): Manufacturing!
    updateManufacturingStage(orderId: ID!, stageName: String!, status: String!, notes: String): Manufacturing!
    deleteManufacturingOrder(id: ID!): Boolean!

    # QR Codes
    generateQRCode(type: String!, id: ID!): String!
    bulkGenerateQRCodes(type: String!, ids: [ID!]!): [String!]!
  }

  type Subscription {
    fabricUpdated(fabricId: ID): Fabric!
    productStatusChanged(productId: ID): Product!
    newManufacturingOrder: Manufacturing!
    inventoryAlert: Alert!
  }

  type Alert {
    id: ID!
    type: AlertType!
    severity: AlertSeverity!
    message: String!
    data: JSON
    timestamp: Date!
  }

  enum AlertType {
    LOW_STOCK
    OUT_OF_STOCK
    PRODUCTION_DELAY
    QUALITY_ISSUE
    SYSTEM
  }

  enum AlertSeverity {
    INFO
    WARNING
    ERROR
    CRITICAL
  }

  # Input Types
  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: UserRole!
    department: String
  }

  input FabricInput {
    type: String!
    color: String!
    quantity: Float!
    unit: String!
    location: String!
    supplier: String
    purchaseDate: Date
    price: Float
  }

  input ProductInput {
    name: String!
    category: String!
    design: String
    size: String
    quantity: Int!
    fabricUsed: [FabricUsageInput!]!
    price: Float
  }

  input FabricUsageInput {
    fabricId: String!
    quantity: Float!
    unit: String!
  }

  input EmployeeInput {
    name: String!
    position: String!
    department: String!
    email: String!
    phone: String!
    skills: [String!]!
  }

  input ManufacturingInput {
    productId: String!
    quantity: Int!
    expectedCompletion: Date!
    assignedTo: [String!]!
  }
`
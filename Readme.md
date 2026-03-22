# CS4218 Project - Virtual Vault

## MS1 CI URL
Run: https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team03/actions/runs/22290375457
- Frontend Job: https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team03/actions/runs/22290375457/job/64476448447
- Backend Job: https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team03/actions/runs/22290375457/job/64476448473

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:
   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:
   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:
   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:
   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:
   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:
   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**
   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**
   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**
   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**
   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:
   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```

## 6. Task Allocation (MS1)
1. Chen Peiran
- Write unit tests for frontend pages and navigation components (HomePage.js, Dashboard.js, Header.js, Footer.js, UserMenu.js, About.js, Contact.js, Policy.js, Pagenotfound.js, userModel.js)
- Write unit tests for layout infrastructure and route protection (Layout.js, Spinner.js, Private.js)
- Write unit tests for Category (useCategory.js, Categories.js, categoryModel.js)
- Write unit tests for Search (SearchInput.js, context/search.js, Search.js)
2. Chen Zhiruo
- Write unit tests for product controller (ProductController.js)
- Write unit tests for product model (ProductModel.js)
- Write unit tests for product details and category product (ProductDetails.js, CategoryProduct.js)
- Write unit tests for admin admin product view (Products.js)
3. Seah Yi Xun, Ryo
- Write unit tests for auth controller (updateProfileController, getOrdersController, getAllOrdersController, orderStatusController in authController.js / authController.test.js)
- Write unit tests for order model (orderModel.js)
- Contribute to cart context and CartPage (context/cart.js, pages/CartPage.js and tests)
- Write unit tests for user Orders page (pages/user/Orders.js)
4. Sun Zihan
- Write unit tests for user authentication and profile management views (Register.js, Login.js, Profile.js, ForgotPassword.js)
- Write unit tests for auth infrastructure, including security helpers, authorization middlewares, and frontend context (authHelper.js, authMiddleware.js, auth.js)
- Write unit tests for auth controller (registerController, loginController, forgotPasswordController, testController in authController.js)
5. Trinh Hoai Song Thu
- Write unit tests for Admin Dashboard (AdminMenu.js, AdminDashboard.js)
- Write unit tests for Admin Actions (CategoryForm.js, CreateCategory.js, CreateProduct.js, UpdateProduct.js, categoryController.js)
- Write unit tests for Admin View Users (Users.js)

## 7. Task Allocation (MS2)

**Seed Script**
- `scripts/seed-e2e.js`: Added standardised seed users (`user@gmail.com`, `admin@gmail.com`, password `123456`) and seed products including an out-of-stock product (`Sports Bottle Zero`, `quantity: 0`) to support stock-state E2E flows

### Chen Peiran (A0257826R)

**Integration Tests**
- `client/src/integration/headerIntegration.test.js` — Tests integration between header search and category dropdown, router navigation, and shared cart state across pages
- `client/src/integration/homePageIntegration.test.js` — Tests integration between homepage filter controls, product rendering, cart context, and navigation
- `tests/integration/productFilter.test.js` — Tests integration between category filters, price filters, and pagination logic in the product filtering endpoint
- `tests/integration/headerSearch.test.js` — Tests integration between search endpoint keyword handling and product database filtering logic
- `tests/integration/headerCategoryDropdown.test.js` — Tests integration between category retrieval endpoints and product queries for header category navigation

**E2E Tests (Playwright)**
- `tests/e2e/headerSearch.spec.js` — User searches for product, checks product details or adds to cart
- `tests/e2e/homepageFilter.spec.js` — User filters by price and category, checks product details or resets filter and loads more products
- `tests/e2e/searchByCategory.spec.js` — User goes to the Category dropdown to look for a category, checks product details

### Chen Zhiruo (A0256855N)

**Integration Tests**
- `tests/integration/productDelete.test.js` — tests integration between deleteProduct, productList & productRoutes
- `client/src/integration/productUpdate.test.js` — tests integration between updateProduct, searchProduct, getSingleProduct & productRoutes
- `client/src/integration/orderStatusUpdate.test.js` — tests integration between authRoute, getOrdersController & orderStatusController

**E2E Tests (Playwright)**
- `scripts\seed-e2e.js` and `.github\workflows\main.yml` - Created a github workflow job with a seeded database to run all ui tests in the pipeline 
- `tests/e2e/adminCreateProduct.spec.js` — admin creates product, checks if product is visible in product list, search and filter results
- `tests/e2e/adminUpdateProduct.spec.js` — admin updates an existing product, checks if updated product is visible in product list, search and filter results
- `tests/e2e/adminDeleteProduct.spec.js` — admin deletes existing product, checks that product is not visible in product list, search and filter results
- `tests/e2e/adminUpdateOrderStatus.spec.js` — admin updates the status of an existing user order, user checks that the status of the order is updated

### Seah Yi Xun, Ryo (A0252602R)

**Integration Tests**
- `client/src/integration/cartFlowIntegration.test.js` — CartProvider + CartPage: add item, view in cart, remove item, assert cart empty (5 tests)
- `client/src/integration/checkoutIntegration.test.js` — CartProvider + CartPage payment section + Orders page: cart summary, total price, orders page access (6 tests)
- `client/src/integration/emptyCartIntegration.test.js` — CartProvider + CartPage: empty cart UI, login-to-checkout prompt, checkout section hidden (6 tests)
- `client/src/integration/addToCartIntegration.test.js` — CartProvider + HomePage + CartPage: add two products, both appear in cart (4 tests)
- `client/src/integration/removeItemTotalIntegration.test.js` — CartProvider + CartPage + totalPrice: remove item updates displayed total and localStorage (5 tests)

**E2E Tests (Playwright)**
- Story A: `tests/e2e/cartFlow.spec.js` — logged-in user adds item, views in cart, removes it; guest user sees empty cart with login prompt (2 tests)
- Story B: `tests/e2e/checkoutFlow.spec.js` — logged-in user sees cart summary and total; logged-in user navigates to orders page via dashboard (2 tests)
- Story D: `tests/e2e/addToCartFlow.spec.js` — logged-in user adds two products, both appear in cart (1 test)


### Sun Zihan (A0259581R)

**Integration Tests**
- `tests/integration/profileSecurity.test.js` — API & Model Integration: Tests the interaction between updateProfileController and userModel to ensure password hashing and partial updates synchronize correctly with the loginController
- `client/src/integration/userIdentityLifecycle.test.js` — Vertical Integration: Validates full data flow between Login.js, AuthContext, and authController.js using a real MongoMemoryServer instance
- `client/src/integration/sessionTokenValidation.test.js` — Security & State Integration: Verifies interaction between AuthProvider, PrivateRoute, and requireSignIn middleware to ensure JWT restoration and reactive axios header synchronization

**E2E Tests (Playwright)**
- `tests/e2e/accountRecovery.spec.js` — Identity Recovery Lifecycle: End-to-end journey from "Forgot Password" request through security answer validation to successful re-authentication and homepage verification
- `tests/e2e/cartProfileFlow.spec.js` — Cross-Component Synchronization: Validates that a user can add items to the cart, update their shipping address in the Profile, and see those changes reflect reactively in the Cart summary
- `tests/e2e/userRegistrationConflict.spec.js` — Identity Collision Handling: Ensures that attempting to re-register with existing credentials triggers the correct error state and does not impede subsequent valid logins (1 test).
- `tests/e2e/profileSync.spec.js` — State Persistence Lifecycle: Verifies that updates made within the Profile are immediately reflected across the User Dashboard and Navigation Bar without a manual page refresh
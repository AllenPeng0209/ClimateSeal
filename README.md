# ClimateSeals AI-Powered Product Carbon Footprint Platform



Welcome to the AI-Powered Product Carbon Footprint (PCF) Platform, a solution designed to simplify and automate how businesses calculate, manage, and report their products' carbon footprints. This platform leverages Artificial Intelligence, with a core **AI Carbon Consultant**, to guide users through the complex PCF process, enhance data quality, and provide actionable insights for decarbonization.

This project is inspired by the need for more efficient, accurate, and scalable PCF solutions in the face of growing climate concerns and regulatory pressures (e.g., CBAM, CSRD). Our goal is to empower businesses to understand and reduce their environmental impact effectively.

Check the [Project Docs](https://your-doc-link-here.com/) for more official installation instructions and information.

## Table of Contents

- [Join the Community](#join-the-community)
- [Requested Additions](#requested-additions)
- [Features](#features)
- [Setup](#setup)
- [Run the Application](#run-the-application)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [FAQ](#faq)


## Project management

This project is a community effort! Still, the core team of contributors aims at organizing the project in way that allows
you to understand where the current areas of focus are.

If you want to know what we are working on, what we are planning to work on, or if you want to contribute to the
project, please check the [project management guide](./PROJECT.md) to get started easily. (Ensure PROJECT.md is updated for this new project)

## Requested Additions


Agent
general 
- ⬜ Vertex AI Integration
- ⬜ Gemini 2.5 pro Integration
- ⬜ Orchestration engine for multi-agent workflows (e.g., data agent feeds consultant agent).

data 
- ⬜ file parse and carbon node generation(pdf, csv, xlxs, docs, txt)
- ⬜ Supplier information management and carbon data tracking.
- ⬜ Intelligent data validation & cleansing beyond basic checks (e.g., outlier detection, unit normalization).
- ⬜ Automated data extraction from diverse enterprise systems (ERP, SCM, MES).
- ⬜ AI-powered data imputation for missing supplier/activity data.
- ⬜ Continuous data quality monitoring and alert system.

consultant 
- ⬜ carbon factor match 
- ⬜ Data quality validation (use gemini 2.5 pro)
- ⬜ Advanced analytics: hotspot analysis, sensitivity analysis, trend analysis, scenario modeling.
- ⬜ Powerful search and AI-assisted knowledge response(consultant)
- ⬜ Recommendation engine for low-carbon material alternatives.
- ⬜ Guidance on setting science-based targets (SBTs).


audit 
- ⬜ Automated generation of pre-audit documentation & evidence packages.
- ⬜ AI-powered identification of potential compliance risks & non-conformities based on submitted data.
- ⬜ Interactive simulation of audit queries and guidance on response formulation.
- ⬜ Powerful law search and AI-assisted response (audit)
- ⬜ Verification support for carbon offsetting and renewable energy claims.
- ⬜ Tracking and management of corrective actions post-audit.



Saas
general
- ⬜ front-end theme 
- ⬜ Report Generation & Visilization 
- ⬜ User roles and permissions management (fine-grained access control).
- ⬜ Comprehensive system-wide audit trail logging for security and compliance (includes data backup and recovery).
- ⬜ Customizable dashboard and reporting templates.
- ⬜ User-configurable workflow management for PCF processes.

carbon factor 
- ⬜ carbon factor database 
- ⬜ ai wrapper for match api
- ⬜ Management of factor validity periods and regional applicability.
- ⬜ User-defined emission factor creation with approval workflow.

knowledge
- ⬜ carbon knowledge base(enterprise)
- ⬜ carbon knowledge base(industry)
- ⬜ carbon knowledge base(laws)
- ⬜ Version control and collaborative editing for enterprise knowledge base articles.
- ⬜ Integration with external regulatory update services for law knowledge base.

Report Generation & Visualization
- ⬜ Generation of PCF reports compliant with multiple standards (e.g., ISO 14067, GHG Protocol, CBAM).
- ⬜ Interactive data visualization tools for hotspot analysis, trend identification, and scenario comparison.
- ⬜ Export reports in various formats (PDF, Excel, CSV).





## Features

This platform aims to provide a comprehensive suite for product carbon footprint management:

For Agents 

- **AI Carbon Consultant**:
    - Natural language interaction to guide users through PCF calculations and management.
    - Assists in data collection, identifying necessary data points based on product type and industry.
    - Intelligently matches materials/activities with appropriate emission factors from a vast database.
    - Assesses data quality and provides actionable improvement suggestions.
    - Offers guidance on regulatory compliance (e.g., ISO 14067, GHG Protocol).
    - Delivers tailored decarbonization strategies based on PCF results.
- **Supplier Data Collection Agent**:
    - Automates and streamlines the process of collecting carbon-related data from suppliers.
    - Provides suppliers with clear guidance and templates for data submission.
    - Tracks data collection progress and flags missing or incomplete information.
- **Audit Advisor Agent**:
    - Guides users through internal and external PCF audit processes.
    - Helps prepare necessary documentation and evidence for auditors.
    - Provides insights on compliance with standards (e.g., ISO 14067, GHG Protocol) from an audit perspective.

    
For SaaS
- **Product & Material Management**:
    - Centralized product library with version control.
    - Multi-level Bill of Materials (BOM) management with versioning and visualization.
    - Master database for materials, including common raw materials, semi-finished goods, and packaging.
    - Supplier information management and carbon performance tracking.
- **Data Collection & Management**:
    - Support for various data import methods (manual, templates, API).
    - Standardized data collection templates.
    - Data quality validation engine with an audit workflow.
    - Comprehensive emission factor database (standard and custom).
    - Activity data management for energy, transport, waste, etc.
- **Carbon Factor Management**:
    - Manages and maintains a comprehensive database of emission factors.
    - Allows users to add, edit, and manage custom or company-specific emission factors.
    - Supports version control and tracking updates for emission factors to ensure data accuracy and traceability.
    - Provides robust search, filtering, and categorization capabilities for easy factor retrieval.
    - Potentially integrates with external and industry-standard emission factor databases.
- **Calculation Engine**:
    - Compliant with ISO 14067 & GHG Protocol product standards.
    - Covers full product lifecycle stages (Cradle-to-Gate, Cradle-to-Grave).
    - Supports various allocation methods.
    - Uncertainty analysis and AI-powered data gap filling.
- **Reporting & Analytics**:
    - Generation of standardized PCF reports (ISO 14067, GHG Protocol).
    - Customizable reports and dashboards.
    - Advanced analytics: hotspot analysis, sensitivity analysis, trend analysis, scenario modeling.
    - Rich data visualization tools.
- **Knowledge Base**:
    - Access to enterprise-specific, industry-specific, academic, and regulatory knowledge.
    - Powerful search and AI-assisted knowledge interpretation.
- **User Management & Collaboration**:
    - Role-based access control.
    - Workflow and task management for PCF processes.
    - Notification and commenting features.
- **System Administration**:
    - Global system configuration.
    - Audit logs, data backup, and recovery.
    - Bulk data import/export capabilities.



## Setup

If you're new to installing software from GitHub, don't worry! If you encounter any issues, feel free to submit an "issue" using the provided links or improve this documentation by forking the repository, editing the instructions, and submitting a pull request. The following instruction will help you get the stable branch up and running on your local machine in no time.

Let's get you up and running with the stable version of climateseals.DIY!

## Quick Download

[![Download Latest Release](https://img.shields.io/github/v/release/stackblitz-labs/climateseals.diy?label=Download%20climateseals&sort=semver)](https://github.com/stackblitz-labs/climateseals.diy/releases/latest) ← Click here to go the the latest release version!

- Next **click source.zip**

## Prerequisites

Before you begin, you'll need to install two important pieces of software:

### Install Node.js

Node.js is required to run the application.

1. Visit the [Node.js Download Page](https://nodejs.org/en/download/)
2. Download the "LTS" (Long Term Support) version for your operating system
3. Run the installer, accepting the default settings
4. Verify Node.js is properly installed:
   - **For Windows Users**:
     1. Press `Windows + R`
     2. Type "sysdm.cpl" and press Enter
     3. Go to "Advanced" tab → "Environment Variables"
     4. Check if `Node.js` appears in the "Path" variable
   - **For Mac/Linux Users**:
     1. Open Terminal
     2. Type this command:
        ```bash
        echo $PATH
        ```
     3. Look for `/usr/local/bin` in the output

## Running the Application


### Option 1: Direct Installation (Recommended for Beginners)

1. **Install Package Manager (pnpm)**:

   ```bash
   npm install -g pnpm
   ```

2. **Install Project Dependencies**:

   ```bash
   pnpm install
   ```

3. **Start the Application**:

   ```bash
   pnpm run dev
   ```
   
### Option 2: Using Docker

This option requires some familiarity with Docker but provides a more isolated environment.

#### Additional Prerequisite

- Install Docker: [Download Docker](https://www.docker.com/)

#### Steps:

1. **Build the Docker Image**:

   ```bash
   # Using npm script:
   npm run dockerbuild

   # OR using direct Docker command:
   docker build . --target climateseals-ai-development
   ```

2. **Run the Container**:
   ```bash
   docker compose --profile development up
   ```

## Configuring API Keys and Providers

### Adding Your API Keys

Setting up your API keys in climateseals.DIY is straightforward:

1. Open the home page (main interface)
2. Select your desired provider from the dropdown menu
3. Click the pencil (edit) icon
4. Enter your API key in the secure input field

![API Key Configuration Interface](./docs/images/api-key-ui-section.png)

### Configuring Custom Base URLs

For providers that support custom base URLs (such as Ollama or LM Studio), follow these steps:

1. Click the settings icon in the sidebar to open the settings menu
   ![Settings Button Location](./docs/images/climateseals-settings-button.png)

2. Navigate to the "Providers" tab
3. Search for your provider using the search bar
4. Enter your custom base URL in the designated field
   ![Provider Base URL Configuration](./docs/images/provider-base-url.png)

> **Note**: Custom base URLs are particularly useful when running local instances of AI models or using custom API endpoints.

### Supported Providers

- Ollama
- LM Studio
- OpenAILike

## Setup Using Git (For Developers only)

This method is recommended for developers who want to:

- Contribute to the project
- Stay updated with the latest changes
- Switch between different versions
- Create custom modifications

#### Prerequisites

1. Install Git: [Download Git](https://git-scm.com/downloads)

#### Initial Setup

1. **Clone the Repository**:

   ```bash
   git clone -b stable https://github.com/stackblitz-labs/climateseals.diy.git
   ```

2. **Navigate to Project Directory**:

   ```bash
   cd climateseals.diy
   ```

3. **Install Dependencies**:

   ```bash
   pnpm install
   ```

4. **Start the Development Server**:
   ```bash
   pnpm run dev
   ```

5. **(OPTIONAL)** Switch to the Main Branch if you want to use pre-release/testbranch:
   ```bash
   git checkout main
   pnpm install
   pnpm run dev
   ```
  Hint: Be aware that this can have beta-features and more likely got bugs than the stable release

>**Open the WebUI to test (Default: http://localhost:5173)**
>   - Beginngers: 
>     - Try to use a sophisticated Provider/Model like Anthropic with Claude Sonnet 3.x Models to get best results
>     - Explanation: The System Prompt currently implemented in climateseals.diy cant cover the best performance for all providers and models out there. So it works better with some models, then other, even if the models itself are perfect for >programming
>     - Future: Planned is a Plugin/Extentions-Library so there can be different System Prompts for different Models, which will help to get better results

#### Staying Updated

To get the latest changes from the repository:

1. **Save Your Local Changes** (if any):

   ```bash
   git stash
   ```

2. **Pull Latest Updates**:

   ```bash
   git pull 
   ```

3. **Update Dependencies**:

   ```bash
   pnpm install
   ```

4. **Restore Your Local Changes** (if any):
   ```bash
   git stash pop
   ```

#### Troubleshooting Git Setup

If you encounter issues:

1. **Clean Installation**:

   ```bash
   # Remove node modules and lock files
   rm -rf node_modules pnpm-lock.yaml

   # Clear pnpm cache
   pnpm store prune

   # Reinstall dependencies
   pnpm install
   ```

2. **Reset Local Changes**:
   ```bash
   # Discard all local changes
   git reset --hard origin/main
   ```

Remember to always commit your local changes or stash them before pulling updates to avoid conflicts.

---

## Available Scripts

- **`pnpm run dev`**: Starts the development server.
- **`pnpm run build`**: Builds the project.
- **`pnpm run start`**: Runs the built application locally using Wrangler Pages.
- **`pnpm run preview`**: Builds and runs the production build locally.
- **`pnpm test`**: Runs the test suite using Vitest.
- **`pnpm run typecheck`**: Runs TypeScript type checking.
- **`pnpm run typegen`**: Generates TypeScript types using Wrangler.
- **`pnpm run deploy`**: Deploys the project to Cloudflare Pages.
- **`pnpm run lint:fix`**: Automatically fixes linting issues.

---

## Contributing

We welcome contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## Roadmap

Our development is planned in phases. Here's a high-level overview:

### Phase 1: MVP 
-   **Core Functionality:**
    -   Basic user management and authentication.
    -   Manual carbon data input.
    -   Simple calculation engine (for small-scale products).
    -   AI Carbon Consultant: Initial conversational interface for guiding report modeling.
    -   Basic report generation & simple data visualization.
    -   Fundamental emission factor management (search & match).
-   Data import/export (basic).

### Phase 2: Standard Edition
-   **Enhanced Core:**
    -   Complete user management and permission system.
    -   More comprehensive calculation engine.
    -   Standardized reporting outputs (ISO 14067, GHG Protocol).
    -   Data quality validation rules.
    -   Product BOM Management.
    -   Initial API integration capabilities.
-   **Knowledge & AI:**
    -   Full knowledge base search.
    -   AI-powered summarization for knowledge base content.

### Phase 3: Advanced Edition
-   Advanced analytical reports.
-   Hotspot analysis.
-   Data quality management workflows.
-   API integration framework.

### Phase 4: Enterprise Edition 
-   **Enterprise Features:**
    -   Carbon reduction target setting & tracking.
    -   Advanced data visualization.
    -   Partial supply chain data integration.
    -   Limited third-party system integration (ERP, PLM).
    -   Workflow management.
    -   AI-assisted analysis and recommendations.
    -   Supply chain carbon footprint (initial).

### Long-term Vision (2028 onwards)
-   Full API platform for developers.
-   Mobile application.
-   Advanced AI predictive analytics & simulation capabilities.
-   Broader system integrations (MES, Energy Management).
-   Multi-language support.
-   Scenario simulation analysis.
-   Comprehensive Knowledge Base system.
-   Carbon trading market connectivity (exploratory).
-   Blockchain for traceability (exploratory).

*This roadmap is subject to change based on development progress and user feedback.*

---

## FAQ



For answers to common questions, issues, and to see a list of recommended models, visit our [FAQ Page](FAQ.md). (Ensure FAQ.md is updated for this new project)

# Licensing
**Who needs a commercial WebContainer API license?**

(Note: Review if WebContainer API is still a core part of this new platform. If not, this section should be removed or updated.)

climateseals.diy source code is distributed as MIT, but it uses WebContainers API that [requires licensing](https://webcontainers.io/enterprise) for production usage in a commercial, for-profit setting. (Prototypes or POCs do not require a commercial license.) If you're using the API to meet the needs of your customers, prospective customers, and/or employees, you need a license to ensure compliance with our Terms of Service. Usage of the API in violation of these terms may result in your access being revoked.




#Acknowledge 
this project is base on bolt.diy, thanks for bolt community for great code base

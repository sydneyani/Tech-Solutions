# Railway Management System

## Project Overview
Welcome to Tech Solutions' Railway Management System, created by a team of 8 members working together to build a comprehensive railway management solution.

## Leader of UI Development
- Sydney Ani

  
## Team Members
- Alessandra Alvarado-Escobar
- Sydney Ani
- Somil Doshi
- Nupoor Vijay Kumbhar
- Nikita Anil Yadav
- Tamjida Nasreen Purba
- Md Moshiur Rahman
- Muhammad Saad Raja
- Shreya Telavane
- Nicolas Osorio

## Setup Instructions

### Environment Configuration
Create a `.env` file in the backend directory with the following content:
```
DB_HOST=localhost
DB_USER=root      # your own username here for your SQL localhost
DB_PASSWORD=1234  # your own password here for your SQL account
DB_NAME=RailroadDB
```

### Installation Steps
Follow these steps in order after cloning the project:

#### Main Directory 
```bash
cd railway-management-system
npm install react-router-dom
npm install uuid
npm install bootstrap
npm install --save jspdf
```

#### Backend Setup (Open a new terminal)
```bash
cd backend
npm install express mysql2 cors dotenv
node server.js
```

#### Frontend Launch
```bash
cd frontend
npm install axios react-router-dom
npm start
```

### Database Setup
Make sure to download and run the entire SQL file from the backend folder named `database.sql`.

### User Access
Once on the site, register for an account and login.

## Development Information

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### We have also Deployed this here for display purposes 

https://tech-solutions-production-e796.up.railway.app/





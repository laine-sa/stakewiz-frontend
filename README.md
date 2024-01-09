# Welcome to Stakewiz Frontend

This project is a next.js project that uses the [Stakewiz API](https://docs.stakewiz.com) to render the Stakewiz Website.

## Getting Started

Set the Stakewiz API and RPC endpoints and Google Analytics tracking ID in the .env file 
```bash
API_BASE_URL=https://api.stakewiz.com/
RPC_URL=<YOUR_RPC>
GA_TRACKING_ID=<YOUR_GA_ID>
```

Other configurations are in `config.json`

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Please feel free to fork and contribute to the website. Plase create a new branch and open a Pull Request which will then be reviewed. You can create an Issue in this repo first if you'd like to discuss the specific problem or feature you're trying to work on and get guidance on how to implement the solution.


## Code structure & History

This project was originally built in React.js using Class Components and later migrated to Next.js and functionality moved mostly into function components. Some sections still use class components. Over time these should be cleaned up and replaced with FCs.
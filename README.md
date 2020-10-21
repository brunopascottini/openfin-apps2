This project is a React based clone of the Qlik Sense native interface. 

### It has primarily been created to:
1. Provide boilerplate business logic to interact with a connected Qlik Sense app from a React web application.
2. Offer reusable (and highly customisable) d3 chart components for use in the web application, with the ability to import an existing visualisation from the connected Qlik Sense app, or create a new object from scratch, all with just a couple of lines of code.

### Main Dependencies:
- React v16 to support functional components and hooks
- Prop types for component prop type checking
- Enigma.js to interface with Qlik Sense App
- D3 (v5) for charts, with d3-lasso for emulation of Qlik Sense's lasso functionality
- Styled components
const express = require("express")
const errorhandler = require("./middleware/errorHandler")
const path = require('path');
const helmet = require('helmet');
const app = express();
const port = 5001;

app.use(
    helmet.contentSecurityPolicy({
      directives: {
        // ...otherDirectives,
        'default-src': ["'self'", "http://localhost:5001"]
      },
    })
  );
  

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json())
app.use(require('./routes/benchmarkRoutes')).use(express.json());
// app.use(errorhandler)
    
app.listen(port,()=>{
console.log(`this ${port}`);
})
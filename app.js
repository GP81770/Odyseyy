if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

// console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejsmate = require("ejs-mate"); //used for the Boilerplate code in the layouts <% layout('boilerplate') -%>
const ExpressError = require("./utils/ExpressError.js"); //used for handling errors
const session = require("express-session"); //to record cookies session
const MongoStore = require("connect-mongo");
const flash = require("connect-flash"); //to display single time message
const passport = require("passport"); //passport is used for setting the password with salting and hashing
const LocalStrategy = require("passport-local"); //lets you authenticate using a username and password
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl); //connect to wanderlust database
}

app.set("view engine", "ejs"); //this is set to use the ejs template in the html files as in view.ejs
app.set("views", path.join(__dirname, "views")); // /path_to_dir/views
app.use(express.urlencoded({ extended: true })); // urlencoded is a middleware function which returns an object {()}
app.use(methodoverride("_method")); //used to input the method delete and put request in the forms
app.engine("ejs", ejsmate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});
store.on("error", () => {
  console.log("Error in mongo session store", err);
});
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //time in milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); //passport.serializeUser() is setting id as cookie in user’s browse
passport.deserializeUser(User.deserializeUser()); //passport.deserializeUser() is getting id from the cookie, which is then used in callback to get user info or something else, based on that id or some other piece of information from the cookie

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.use("/listings", listingRouter); //assign corresponding file to the respective path
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

app.get("/search", async (req, res) => {
  try {
    const query = req.query.query || "";
    const regex = new RegExp(query, "i"); // Case-insensitive search

    // Adjust the criteria according to the fields you want to search within
    const listings = await Listing.find({
      $or: [
        { title: regex }, // Search by title
        { description: regex }, // Optional: Search by description if available
        { location: regex }, // Optional: Search by location if you have this field
      ],
    });

    res.render("listings/index", { allListings: listings }); // Render with filtered listings
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).send("Server Error");
  }
});

app.listen(8080, () => {
  console.log("server is listening on port 8080");
});

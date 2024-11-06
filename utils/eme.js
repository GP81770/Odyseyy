app.post("/listings", async (req, res) => {
    try {
      const { title, description, image, price, country, location } =
        req.body.listing;
  
      if (!req.body.listing) {
        throw new ExpressError(400, "INVALID LISTING");
      }
  
      const newListing = new Listing({
        title,
        description,
        image,
        price,
        country,
        location,
      });
  
      const result = await newListing.save();
      console.log(result)
      res.redirect("/listings");
    } catch (error) {
      console.log(error);
    }
  });

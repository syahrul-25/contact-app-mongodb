const express = require("express");
const expressEjsLayouts = require("express-ejs-layouts");
const session = require("express-session");
const morgan = require("morgan");
const { body, validationResult, check } = require("express-validator");
const app = express();
require("./utils/db");
const Contact = require("./model/Contact");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const port = 3000;
const domain = `http://localhost:${port}`;

app.set("view engine", "ejs");

// middleware
app.use(express.static("public"));
app.use(morgan("dev"));
app.use(expressEjsLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(methodOverride("_method"));

app.use(flash());

app.get("/", (req, res) => {
  const mahasiswa = [
    {
      nama: "Hendrik",
      email: "hendrik@gmail.com",
    },
    {
      nama: "Rizal",
      email: "rizal@gmail.com",
    },
    {
      nama: "Icank",
      email: "icank@gmail.com",
    },
  ];
  res.render("index", {
    layout: "layouts/main-layout",
    nama: "Rizal",
    title: "Halaman Home",
    mahasiswa,
    error: false,
  });
});

app.get("/about", (req, res, next) => {
  res.render("about", {
    layout: "layouts/main-layout",
    title: "Halaman About",
    error: false,
  });
});

app.get("/contact", async (req, res) => {
  const contacts = await Contact.find({}).sort({ _id: -1 });
  res.render("contact", {
    title: "Halaman Contact",
    layout: "layouts/main-layout",
    contacts,
    msg: req.flash("msg"),
  });
});

app.delete("/contact", (req, res) => {
  Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    req.flash("msg", "Data Contact berhasil dihapus");
    res.redirect("/contact");
  });
});

app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Halaman Tambah Contact",
    layout: "layouts/main-layout",
  });
});

app.put(
  "/contact",
  [
    body("nama").custom(async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (value != req.body.nama_lama && duplikat)
        throw new Error("Nama contact sudah digunakan!");
      return true;
    }),
    check("email", "Email tidak valid!!").isEmail(),
    check("noHp", "Nomor HP tidak valid!!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("edit-contact", {
        title: "Form buah Data Contact",
        layout: "layouts/main-layout",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            email: req.body.email,
            noHp: req.body.noHp,
          },
        }
      ).then((result) => {
        req.flash("msg", "Data Contact Berhasil Di Ubah");
        res.redirect("/contact");
      });
    }
  }
);

app.get("/contact/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render("detail", {
    title: "Halaman Detail Contact",
    layout: "layouts/main-layout",
    contact,
  });
});

app.get("/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render("edit-contact", {
    title: "Halaman Detail Contact",
    layout: "layouts/main-layout",
    contact,
  });
});

app.post(
  "/contact",
  [
    body("nama").custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (duplikat) throw new Error("Nama contact sudah digunakan!");
      return true;
    }),
    check("email", "Email tidak valid!!").isEmail(),
    check("noHp", "Nomor HP tidak valid!!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Form tambh Data Contact",
        layout: "layouts/main-layout",
        errors: errors.array(),
      });
    } else {
      Contact(req.body).save();
      req.flash("msg", "Data contact berhasil di tambahkan");
      res.redirect("/contact");
    }
  }
);

// app.get("/contact/delete/:nama", (req, res) => {
//   const contact = Contact.findOne({ nama: req.params.nama });
//   if (!contact) {
//     res.status(404);
//     res.send("<h1>404</h1>");
//   } else {
//     Contact.deleteOne({ nama: req.params.nama });
//     req.flash("msg", "Data Contact berhasil dihapus");
//     res.redirect("/contact");
//   }
// });

app.listen(port, () => {
  console.log(`Mongo Contact app | listening at ${domain}`);
});

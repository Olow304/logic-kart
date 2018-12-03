const express = require('express')
const mkdirp = require('mkdirp')
const fsExtra = require('fs-extra')
const resizeImage = require('resize-img')

const Product = require('../models/product')
const Category = require('../models/categories')

const auth = require('../config/auth')
const isAdmin = auth.isAdmin

const router = express.Router()

/*
 * GET products index
 */
router.get('/', isAdmin, (req, res, next) => {
    let count;
    Product.count(function(err, c){
        count = c;
    })

    Product.find(function(err, products){
        res.render('_layouts/admin/products', {
            products: products,
            count: count
        })
    })
})


/*
 * GET add products
 */
router.get('/add-product', isAdmin, (req, res, next) => {
    const title = ''
    const desc = ''
    const price = ''

    Category.find(function(err, categories){
        res.render('_layouts/admin/add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        })
    })
})

/*
 * POST add product
 */
router.post('/add-product', (req, res, next) => {

    let imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'title most have a value').notEmpty()
    req.checkBody('desc', 'Description most have a value').notEmpty()
    req.checkBody('price', 'Price most be a number').isDecimal()
    req.checkBody('image', 'You most upload an image').isImage(imageFile)

    let title = req.body.title
    let slug = title.replace(/\s+/g, '-').toLowerCase()
    let desc = req.body.desc
    let price = req.body.price
    let category = req.body.category

    let errors = req.validationErrors()

    if(errors){
        Category.find(function(err, categories){
            res.render('_layouts/admin/add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            })
        })
    }else{
        // if there not errors, then save to database
        Product.findOne({slug: slug}, function(err, product){
            if(product){
                req.flash('danger', 'Product ttle alread exist, choose another')
                Category.find(function(err, categories){
                    res.render('_layouts/admin/add_product', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    })
                })
            }else{
                var finalPrice = parseFloat(price).toFixed(2)
                const product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: finalPrice,
                    category: category,
                    image: imageFile
                })

                product.save(function(err){
                    if(err) return console.log(err)

                    mkdirp('public/product_images/' + product._id, function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery', function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        let productImage = req.files.image;
                        let path = 'public/product_images/' + product._id + '/' + imageFile;
                        productImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }

                    req.flash('success', 'product added')
                    res.redirect('/admin/products')
                })
            }
        })
    }
})

/*
 * GET edit product
 */
router.get('/edit-product/:id', isAdmin, (req, res, next) => {
    var errors;

    if (req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;

    Category.find(function (err, categories) {

        Product.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('_layouts/admin/products');
            } else {
                var galleryDir = 'public/product_images/' + p._id + '/gallery';
                var galleryImages = null;

                fsExtra.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('_layouts/admin/edit_product', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: categories,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(p.price).toFixed(2),
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        });
                    }
                });
            }
        });

    });
})

/*
 * POST edit product
 */
router.post('/edit-product/:id', (req, res, next) => {
    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('_layouts/admin/products/edit-product/' + id);
    } else {
        Product.findOne({slug: slug, _id: {'$ne': id}}, function (err, p) {
            if (err)
                console.log(err);

            if (p) {
                req.flash('danger', 'Product title exists, choose another.');
                res.redirect('_layouts/admin/products/edit-product/' + id);
            } else {
                Product.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;
                    if (imageFile != "") {
                        p.image = imageFile;
                    }

                    p.save(function (err) {
                        if (err)
                            console.log(err);

                        if (imageFile != "") {
                            if (pimage != "") {
                                fsExtra.remove('public/product_images/' + id + '/' + pimage, function (err) {
                                    if (err)
                                        console.log(err);
                                });
                            }

                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });

                        }

                        req.flash('success', 'Product edited!');
                        res.redirect('_layouts/admin/products/edit-product/' + id);
                    });

                });
            }
        });
    }

})

/*
 * POST product gallery
 */
router.post('/product-gallery/:id', (req, res, next) => {
    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImage(fsExtra.readFileSync(path), {width: 100, height: 100}).then(function (buf) {
            fsExtra.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);

})

/*
 * GET delete image
 */
router.get('/delete-image/:image', isAdmin, (req, res, next) => {
    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;
    
    fsExtra.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fsExtra.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted!');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    });

})

/*
 * GET delete product
 */
router.get('/delete-product/:id', isAdmin, (req, res, next) => {
    var id = req.params.id 
    var paths = 'public/product_images/' + id 

    fsExtra.remove(paths, function(err){
        if(err){
            console.log(err)
        }else{
            Product.findByIdAndRemove(id, function(err){
                console.log(err)
            })
            req.flash('success', 'Product deleted!');
            res.redirect('/admin/products/');
        }
    })
})

module.exports = router
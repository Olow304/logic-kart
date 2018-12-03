const express = require('express')
const router = express.Router()
const Product = require('../models/product')
const Category = require('../models/categories')
const fs = require('fs-extra')

/*
 * GET all products
 */
router.get('/', (req, res, next) => {
    Product.find(function (err, products) {
        if (err)
            console.log(err);

        res.render('all_products', {
            title: 'All Product',
            products: products
        });
    });
})

/*
 * GET product by category
 */
router.get('/:category', (req, res, next) => {
    var categorySlug = req.params.category
    Category.findOne({slug: categorySlug}, function(err, c){
        Product.find({category: categorySlug},function (err, products) {
            if (err)
                console.log(err);
    
            res.render('cat_products', {
                title: c.title,
                products: products
            });
        });
    })
    
})

/*
 * GET product by category detail
 */
router.get('/:category/:product', (req, res, next) => {
    var galleryImages = null
    var isLogin = (req.isAuthenticated()) ? true : false
    Product.findOne({slug: req.params.product}, function(err, product){
        if(err){
            console.log(err)
        }else{
            var GalleryDir = 'public/product_images/'+ product._id + '/gallery'
            fs.readdir(GalleryDir, function(err, files){
                if(err){
                    console.log(err)
                }else{
                    galleryImages = files
                    res.render('product', {
                       title: product.title,
                       p: product,
                       galleryImages: galleryImages,
                       isLogin: isLogin 
                    })
                }
            })
        }
    })
    
    
})


module.exports = router
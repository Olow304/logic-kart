const express = require('express')
const router = express.Router()
const Page = require('../models/page')


/*
 * GET   
 */
router.get('/', (req, res, next) => {
    Page.findOne({slug: 'home'}, function (err, page) {
        if (err)
            console.log(err);

        res.render('index', {
            title: page.title,
            content: page.content
        });
    });
})

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
 * GET a page  
 */
router.get('/:slug', (req, res, next) => {
    var slug = req.params.slug
    Page.findOne({slug: slug}, function(err, page){
        if(err){
            console.log(err)
        }

        if(!page){
            res.redirect('/')
        }else{
            res.render('index', {
                title: page.title,
                content: page.content
            })
        }

    })
})


module.exports = router
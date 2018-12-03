const express = require('express')
const router = express.Router()
const Category = require('../models/categories')

const auth = require('../config/auth')
const isAdmin = auth.isAdmin

/*
 * GET categories index
 */
router.get('/', isAdmin, (req, res, next) => {
    Category.find(function(err, categories){
        if(err) return console.log(err)
        res.render('_layouts/admin/categories', {
            categories: categories
        })
    })
})


/*
 * GET add page
 */
router.get('/add-category', isAdmin, (req, res, next) => {
    const title = ''

    res.render('_layouts/admin/add_category', {
        title: title
    })
})

/*
 * POST add category
 */
router.post('/add-category', (req, res, next) => {

    req.checkBody('title', 'title most have a value').notEmpty()

    let title = req.body.title
    let slug = title.replace(/\s+/g, '-').toLowerCase()
    
    let errors = req.validationErrors()

    if(errors){
        res.render('_layouts/admin/add_category', {
            errors: errors,
            title: title
        })
    }else{
        // if there not errors, then save to database
        Category.findOne({slug: slug}, function(err, category){
            if(category){
                req.flash('danger', 'Category title alread exist, choose another')
                res.render('_layouts/admin/add_category', {
                    title: title
                })
            }else{
                const category = new Category({
                    title: title,
                    slug: slug
                })

                category.save(function(err){
                    if(err) return console.log(err)
                    Category.find(function(err, categories){
                        if(err){
                            console.log(err)
                        }else{
                            req.app.locals.categories = categories
                        }
                    })
                    req.flash('success', 'category added')
                    res.redirect('/admin/categories')
                })
            }
        })
    }
})

/*
 * GET edit page
 */
router.get('/edit-category/:id', isAdmin, (req, res, next) => {
    Category.findById(req.params.id, (err, categories) => {
        if(err) return console.log(err)
        res.render('_layouts/admin/edit_category', {
            title: categories.title,
            id: categories._id
        })
    })
})

/*
 * POST edit page
 */
router.post('/edit-category/:id', (req, res, next) => {

    req.checkBody('title', 'title most have a value').notEmpty()

    let title = req.body.title
    let slug = title.replace(/\s+/g, '-').toLowerCase()

    let id = req.body.id

    let errors = req.validationErrors()

    if(errors){
        res.render('_layouts/admin/edit_category', {
            errors: errors,
            title: title,
            id: id
        })
    }else{
        // if there not errors, then save to database
        Category.findOne({title: title, _id: {"$ne": id}}, function(err, categories){
            if(categories){
                req.flash('danger', 'Category title alread exist, choose another')
                res.render('_layouts/admin/edit_category', {
                    title: title,
                    slug: slug,
                    id: id
                })
            }else{
                Category.findById(id, function(err, categories){
                    if(err) return console.log(err)

                    categories.title = title
                    categories.slug = slug

                    categories.save(function(err){
                        if(err) return console.log(err)
                        Category.find(function(err, categories){
                            if(err){
                                console.log(err)
                            }else{
                                req.app.locals.categories = categories
                            }
                        })
                        req.flash('success', 'Category added!')
                        res.redirect('/admin/categories/')
                    })
                })
            }
        })
    }
})

/*
 * GET delete page
 */
router.get('/delete-category/:id', isAdmin, (req, res, next) => {
    Category.findByIdAndRemove(req.params.id, function(err){
        if(err) return console.log(err)
        Category.find(function(err, categories){
            if(err){
                console.log(err)
            }else{
                req.app.locals.categories = categories
            }
        })
        req.flash('success', 'Category deleted successfully')
        res.redirect('/admin/categories/')
    })
})

module.exports = router
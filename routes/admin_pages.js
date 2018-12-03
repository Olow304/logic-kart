const express = require('express')
const router = express.Router()
const Page = require('../models/page')

const auth = require('../config/auth')
const isAdmin = auth.isAdmin
/*
 * GET pages index
 */
router.get('/', isAdmin, (req, res, next) => {
    Page.find({}).sort({sorting: 1}).exec(function(err, pages){
        res.render('_layouts/admin/pages', {
            pages: pages,
            admin: 'Admin Area'
        })
    })
})


/*
 * GET add page
 */
router.get('/add-page', isAdmin, (req, res, next) => {
    const title = ''
    const slug = ''
    const content = ''

    res.render('_layouts/admin/add_page', {
        title: title,
        slug: slug,
        content: content
    })
})

/*
 * POST add page
 */
router.post('/add-page', (req, res, next) => {

    req.checkBody('title', 'title most have a value').notEmpty()
    req.checkBody('content', 'content most have a value').notEmpty()

    let title = req.body.title
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase()
    if(slug === ""){
        slug = title.replace(/\s+/g, '-').toLowerCase()
    }
    let content = req.body.content

    let errors = req.validationErrors()

    if(errors){
        res.render('_layouts/admin/add_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content
        })
    }else{
        // if there not errors, then save to database
        Page.findOne({slug: slug}, function(err, page){
            if(page){
                req.flash('danger', 'Page slug alread exist, choose another')
                res.render('_layouts/admin/add_page', {
                    title: title,
                    slug: slug,
                    content: content
                })
            }else{
                const page = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 1001
                })

                page.save(function(err){
                    if(err) return console.log(err)
                    req.flash('success', 'page added')
                    res.redirect('/admin/pages')
                })
            }
        })
    }
})

/*
 * POST reoder page
 */
router.post('/reorder-pages', (req, res, next) => {
    const ids = req.body['id[]']
    const count  = 0
    for(var i = 0; i < ids.length; i++){
        const id = ids[i]
        count++;

        Page.findById(id, function(err, page){
            page.sorting = count
            page.save(function(err){
                if(err) return console.log(err)
            })
        })
    }
})

/*
 * GET edit page
 */
router.get('/edit-page/:id', isAdmin, (req, res, next) => {
    Page.findById(req.params.id, (err, page) => {
        if(err) return console.log(err)
        res.render('_layouts/admin/edit_page', {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        })
    })
})

/*
 * POST edit page
 */
router.post('/edit-page/:id', (req, res, next) => {

    req.checkBody('title', 'title most have a value').notEmpty()
    req.checkBody('content', 'content most have a value').notEmpty()

    let title = req.body.title
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase()
    if(slug === ""){
        slug = title.replace(/\s+/g, '-').toLowerCase()
    }
    let content = req.body.content
    let id = req.params.id

    let errors = req.validationErrors()

    if(errors){
        res.render('_layouts/admin/edit_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        })
    }else{
        // if there not errors, then save to database
        Page.findOne({slug: slug, _id: {"$ne": id}}, function(err, page){
            if(page){
                req.flash('danger', 'Page slug alread exist, choose another')
                res.render('_layouts/admin/edit_page', {
                    title: title,
                    slug: slug,
                    content: content,
                    id: id
                })
            }else{
                Page.findById(id, function(err, page){
                    if(err) return console.log(err)

                    page.title = title
                    page.slug = slug
                    page.content = content

                    page.save(function(err){
                        if(err) return console.log(err)
                        req.flash('success', 'page added!')
                        res.redirect('/admin/pages/edit-page/' + id)
                    })
                })
            }
        })
    }
})

/*
 * GET delete page
 */
router.get('/delete-page/:id', isAdmin, (req, res, next) => {
    Page.findByIdAndRemove(req.params.id, function(err){
        if(err) return console.log(err)
        req.flash('success', 'page deleted successfully')
        res.redirect('/admin/pages/')
    })
})

module.exports = router
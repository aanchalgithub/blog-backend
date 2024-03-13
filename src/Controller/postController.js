const Post = require('../Models/postModel')
const User = require('../Models/userModel')
const path = require('path')
const fs = require('fs')
const {v4 : uuid} = require('uuid')
const HttpError = require('../Models/errorModel')
const { default: mongoose } = require('mongoose')



//----------------------------------Create a Post--------------------------------------
// POST : api/posts
//PROTECTED
const createPost = async(req,res,next) => {
  
    try {
        let {title, category, description} = req.body
        if(!title || !category || !description || !req.files){
            return next(new HttpError("Fill in all details and choose thumbnail",422))
        }

        const {thumbnail} = req.files
        if(thumbnail.size > 2000000){
            return next(new HttpError("Thumbnail is too big, Files should be less than 2mb"))
        }

        let fileName = thumbnail.name;
        let splittedFleName = fileName.split('.');
        let newFileName = splittedFleName[0] + uuid() + '.' + splittedFleName[splittedFleName.length -1]
        thumbnail.mv(path.join(__dirname, '../..', '/uploads', newFileName), async (err) => {
            if(err){
                return next(new HttpError(err))
            } else {
                let newPost = await Post.create({title, category, description, thumbnail : newFileName, 
                    creator : req.user.id})

                if(!newPost){
                    return next(new HttpError("Post Could not be created.",422))
                }

                // Find User and create post count by 1
                const currentUser = await User.findById(req.user.id)
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id, {posts : userPostCount})

                res.status(201).json(newPost)
            }
        })
    } catch (error) {
        return next(new HttpError(error))
    }
}

//----------------------------------GET all Posts--------------------------------------
// POST : api/posts
//UNPROTECTED
const getPosts = async(req,res,next) => {
    try {
        const posts = await Post.aggregate([
            {
              '$lookup': {
                'from': 'users', 
                'localField': 'creator', 
                'foreignField': '_id', 
                'as': 'user'
              }
            }, {
              '$unwind': {
                'path': '$user', 
                'preserveNullAndEmptyArrays': true
              }
            }
          ])
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

//----------------------------------GET Single Post--------------------------------------
// POST : api/posts/:id
//PROTECTED

const getPost = async(req,res,next) => {
    try {
        
        const postId = req.params.id
        const post = await Post.aggregate([
          {
            $match:{
              _id:new mongoose.Types.ObjectId(postId)
            }
          },
          {
            '$lookup': {
              'from': 'users', 
              'localField': 'creator', 
              'foreignField': '_id', 
              'as': 'user'
            }
          }, {
            '$unwind': {
              'path': '$user', 
              'preserveNullAndEmptyArrays': true
            }
          }

        ])
        if(!post?.length){
            return next(new HttpError("Post not Found 404 !!!",404))
        }
const data=post?.length>0?post[0]:{}
        res.status(200).json(data)
    } catch (error) {
        return next(new HttpError(error))
    }
}

//----------------------------------GET Posts by category--------------------------------------
// POST : api/posts/categories/:category
//UNPROTECTED

const getCatPosts = async (req, res, next) => {
    try {
      const { category } = req.params;
  
      
      const posts = await Post.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: { category }, 
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);
  
    
  
      res.status(200).json(posts);
    } catch (error) {
      return next(new HttpError(error)); 
    }
  };

//----------------------------------GET the Author Post--------------------------------------
// POST : api/posts/users/:id
//PROTECTED

const getUserPosts = async (req, res, next) => {
    try {
      const { id } = req.params;
  
      const posts = await Post.aggregate([
        {
          $match: { creator: new mongoose.Types.ObjectId(id) }, 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { createdAt: -1 }, 
        },
      ]);
  
      res.status(200).json(posts);
    } catch (error) {
      return next(new HttpError(error));
    }
  };


//----------------------------------Edit Post--------------------------------------
// PATCH : api/posts/edit-user/:id
//PROTECTED

const editPost = async (req, res, next) => {
    try {
        let fileName;
        let newFileName;
        let updatedPost;

        const postId = req.params.id;
        console.log(req.body)
        const { title, category, description } = req.body;
        console.log(title, category, description);

        // Check if required fields are missing or invalid
        if (!title || !category ||  description.length < 12) {
            return next(new HttpError("Fill in all Details", 422));
        }

        if (!req.files) {
            // If no files are uploaded, update post without changing thumbnail
            updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description }, { new: true });
        } else {
            // Get old post from database
            const oldPost = await Post.findById(postId);
            // Delete old thumbnail from upload
            fs.unlink(path.join(__dirname, '../..', 'uploads', oldPost.thumbnail), async (err) => {
                if (err) {
                    return next(new HttpError(err));
                }
            });
            // Upload new thumbnail
            const {thumbnail} = req.files;
            // Check file size
            if (thumbnail.size > 2000000) {
                return next(new HttpError("Thumbnail is too big. Should be less than 2mb"));
            }
            fileName = thumbnail.name;
            let splittedFileName = fileName.split('.');
            newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1];
            thumbnail.mv(path.join(__dirname, '../..', 'uploads', newFileName), async (err) => {
                if (err) {
                    return next(new HttpError(err));
                }
            });
            updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description, thumbnail: newFileName }, { new: true });
        }

        if (!updatedPost) {
            return next(new HttpError("Could not update the post", 400));
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        return next(new HttpError(error));
    }
};

//----------------------------------Delete Post--------------------------------------
// DELETE : api/posts/delete/:id
//PROTECTED

const deletePost = async(req,res,next) => {
    try {
        const postId = req.params.id;
        if(!postId){
            return next(new HttpError("Post Unavilable",400))
        }
        const post = await Post.findById(postId)
        const fileName = post?.thumbnail
        if(req.user.id == post.creator){
            //Delete thumbnail from uploads folder
            fs.unlink(path.join(__dirname, '../..', 'uploads', fileName), async (err) => {
                if(err){
                    return next(new HttpError(err))
                }else{
                    await Post.findByIdAndDelete(postId)
                
    
                //Find user and reduce count by 1
                const currentUser = await User.findById(req.user.id)
                const userPostCount = currentUser?.posts -1
    
                await User.findByIdAndUpdate(req.user.id, {posts : userPostCount})
                res.json(`Post ${postId} deleted successfully`)
                }
            })   
        }else{
            return next("Post could not be deleted",403)
        }

        
        
        
    } catch (error) {
        return next(new HttpError(error))
    }
}




module.exports = {createPost, getPosts, getPost, getCatPosts, getUserPosts, editPost, deletePost}
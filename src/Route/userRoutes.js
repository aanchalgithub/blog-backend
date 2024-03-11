const Routes = require('express')
const {registerUser, loginUser, getUser, changeAvtar, editUser, getAuthors} = require('../Controller/userControllers')
const authMiddleware = require('../middleware/authMiddleware')

const router = Routes()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/:id', getUser)
router.post('/change-avtar',authMiddleware, changeAvtar)
router.patch('/edit-user',authMiddleware, editUser)
router.get('/', getAuthors)


module.exports = router
const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { db } = require('./util/admin');

const { getGanduri , postOneGand, getGand , commentOnGand , likeGand , unlikeGand , deleteGand } = require('./handlers/gand');
const { signup , login , uploadImage , addUserDetails , getAuthenticatedUser , getUserDetails , markNotificationsRead} = require('./handlers/users');

const { object } = require('firebase-functions/v1/storage');
const fbAuth = require('./util/fbAuth');
//const { postOneGand } = require('./handlers/gand');

//Gand route
app.get('/gand' , getGanduri);
app.post('/gand' , FBAuth , postOneGand);
app.get('/gand/:gandId', getGand);
app.get('/gand/:gandId/like', FBAuth , likeGand);
app.get('/gand/:gandId/unlike', FBAuth , unlikeGand);
app.delete('/gand/:gandId', FBAuth , deleteGand);
app.post('/gand/:gandId/comment' , FBAuth , commentOnGand);

//users route

app.post('/signup', signup);
app.post('/login' , login);
app.post('/user/image',FBAuth , uploadImage);
app.post('/user' , FBAuth , addUserDetails);
app.get('/user' , FBAuth , getAuthenticatedUser);
app.get('/user/:handle' , getUserDetails);
app.post('/notifications' , FBAuth ,  markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}').onCreate((snapshot) => {
    return db.doc(`/gand/${snapshot.data().gandId}`).get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    gandId: doc.id
                });
            }
        })
        .catch((err) => 
            console.error(err));
});

exports.deleteNotificationOnUnlike = functions.region('europe-west1').firestore.document('likes/{id}').onDelete((snapshot) =>{
    return db.doc(`notifications/${snapshot.id}`)
        .delete()
        .catch((err) => {
            console.error(err);
            return;
        })
});

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}').onCreate((snapshot) => {
    return db.doc(`/gand/${snapshot.data().gandId}`).get()
    .then(doc => {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read: false,
                gandId: doc.id
            });
        }
    })
    .catch((err) => {
        console.error(err);
        return;
    });  
});

exports.onUserImageChange = functions.region('europe-west1').firestore.document('/users/{userId}').onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data().imageUrl){
            console.log('image has changed');
            const batch = db.batch();
            return db.collection('gand').where('userHandle' , '==' , change.before.data().handle).get()
            .then((data) => {
                data.forEach(doc => {
                    const gand = db.doc(`/gand/${doc.id}`);
                    batch.update(gand , { userImage: change.after.data().imageUrl});
                })
                return batch.commit();
            })
        } else return true;
    });

exports.onGandDelete = functions.region('europe-west1').firestore.document('/gand/{gandId}').onDelete((snapshot , context) => {
        const gandId = context.params.gandId;
        const batch = db.batch();
        return db.collection('comments').where('gandId' , '==' , gandId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes').where('gandId' , '==' , gandId).get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications').where('gandId' , '==' , gandId).get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit();
            })
            .catch(err => {
                console.error(err);
            })
    })
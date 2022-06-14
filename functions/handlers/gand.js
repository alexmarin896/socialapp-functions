const {db} = require('../util/admin');

exports.getGanduri = (req,res) => {
    db
    .collection('gand')
    .orderBy('createdAt','desc')
    .get()
    .then(data => 
      {
        let gand = []; 
        data.forEach(doc => 
        {
          gand.push({
              gandId: doc.id,
              body: doc.data().body,
              userHandle: doc.data().userHandle,
              createdAt: doc.data().createdAt,
              commentCount: doc.data().commentCount,
              likeCount: doc.data().likeCount,
              userImage: doc.data().userImage
            });
        });
        return res.json(gand);
      })
      .catch(err => console.error(err));
  }

  exports.postOneGand =  (req , res) => { 
  
    if(req.body.body.trim() === '')
    {
      return res.status(400).json({ body: 'Body nu trebuie sa fie gol'});
    }
  
    const newGand = 
    {
      body: req.body.body,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl,
      createdAt : new Date().toISOString(),
      likeCount: 0,
      commentCount: 0
    };
  
    db
    .collection('gand')
    .add(newGand)
    .then((doc) => {
      const resGand = newGand;
      resGand.gandId = doc.id;
      res.json(resGand);
    })
  
    .catch((err) => {
      res.status(500).json({ error: 'Ceva nu a mers bine'});
      console.error(err);
    });
  };

  exports.getGand = (req, res) => {
    let gandData = {};
    db.doc(`/gand/${req.params.gandId}`).get()
      .then(doc => {
        if(!doc.exists){
          return res.status(404).json({ error: 'Gandul nu a fost gasit'})
        }
        gandData = doc.data();
        gandData.gandId = doc.id;
        return db.collection('comments').orderBy('createdAt' , 'desc').where('gandId' , '==' , req.params.gandId).get();
      })
      .then(data => {
        gandData.comments = [];
        data.forEach(doc => {
          gandData.comments.push(doc.data())
        });
        return res.json(gandData);
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code});
      })
  };

  //Comment la un comment
  exports.commentOnGand = (req,res) => {
    if(req.body.body.trim() === '') 
      return res.status(400).json({ comment: 'Comentariul nu trebuie sa fie gol'});

    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      gandId: req.params.gandId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };

    db.doc(`/gand/${req.params.gandId}`).get()
      .then(doc => {
        if(!doc.exists){
          return res.status(404).json({ error: 'gandul nu e gasit'});
        }
        return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
      })
      .then(() => {
        return db.collection('comments').add(newComment);
      })
      .then(() => {
        res.json(newComment);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: 'Ceva nu a mers bine' });
      })
  }
  exports.likeGand = (req , res) =>{
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
      .where('gandId', '==' , req.params.gandId).limit(1);

      const gandDocument = db.doc(`/gand/${req.params.gandId}`);

      let gandData;

      gandDocument.get()
        .then(doc => {
          if(doc.exists){
            gandData = doc.data();
            gandData.gandId = doc.id;
            return likeDocument.get();
          } else {
            return res.status(404).json({ error: 'Gandul nu a fost gasit'});
          }
        })
        .then(data => {
          if(data.empty){
            return db.collection('likes').add({
              gandId: req.params.gandId,
              userHandle: req.user.handle
            })
            .then(() =>{
              gandData.likeCount++;
              return gandDocument.update({ likeCount: gandData.likeCount });
            })
            .then(() => {
              return res.json(gandData);
            })
          } else {
            return res.status(400).json({ error: 'Gandul deja a primit like'});
          }
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ error:err.code });
        })
  }

  exports.unlikeGand = (req , res) =>{
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
      .where('gandId', '==' , req.params.gandId).limit(1);

      const gandDocument = db.doc(`/gand/${req.params.gandId}`);

      let gandData;

      gandDocument.get()
        .then(doc => {
          if(doc.exists){
            gandData = doc.data();
            gandData.gandId = doc.id;
            return likeDocument.get();
          } else {
            return res.status(404).json({ error: 'Gandul nu a fost gasit'});
          }
        })
        .then(data => {
          if(data.empty){
            return res.status(400).json({ error: 'Gandul a primit unlike'});
          } else {
              return db.doc(`/likes/${data.docs[0].id}`).delete()
            .then(() =>{
              gandData.likeCount--;
              return gandDocument.update({ likeCount: gandData.likeCount });
            })
            .then(() => {
              res.json(gandData);
            })
          }
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ error:err.code });
        })
  };
// Stergerea unui gand
 exports.deleteGand = (req , res) => {
   const document = db.doc(`/gand/${req.params.gandId}`);
   document.get()
    .then(doc => {
      if(!doc.exists){
        return res.status(404).json({ error: 'Gandul nu a fost gasit'});
      }
      if(doc.data().userHandle !== req.user.handle){
        return res.status(403).json({ error: 'Neautorizat'});
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Gandul a fost sters cu succes'});
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
 };
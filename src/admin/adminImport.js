const  admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

const data = require("./data-clean/firestore/palindromes.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://palforge-7c736.firebaseio.com"
});

data && Object.keys(data).forEach(key => {
    const nestedContent = data[key];

    if (typeof nestedContent === "object") {
        //console.log(JSON.stringify(nestedContent));
        Object.keys(nestedContent).forEach(docTitle => {
            let createTime = new Date();//firebase.firestore.Timestamp.fromDate(new Date());
            let entry = nestedContent[docTitle];
            entry.createTime = createTime;
            admin.firestore()
                .collection(key)
                .add(nestedContent[docTitle])
                .then((ref) => {
                    console.log("Document successfully written with refRid ", ref.id);
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
        });
    }
});
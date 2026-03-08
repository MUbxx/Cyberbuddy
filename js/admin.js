import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.getElementById("upload").onclick=async()=>{

const title=document.getElementById("title").value;
const video=document.getElementById("video").value;

await addDoc(collection(db,"courses"),{

title,
video

});

alert("Course added");

};

const list=document.getElementById("list");

const snap=await getDocs(collection(db,"courses"));

snap.forEach(c=>{

list.innerHTML+=`<p>${c.data().title}</p>`;

});

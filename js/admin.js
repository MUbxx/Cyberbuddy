import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
deleteDoc,
doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.getElementById("upload").onclick = async ()=>{

const title = document.getElementById("title").value;
const video = document.getElementById("video").value;

await addDoc(collection(db,"courses"),{

title,
video

});

alert("Course Uploaded");

location.reload();

};

const list = document.getElementById("courseList");

const snapshot = await getDocs(collection(db,"courses"));

snapshot.forEach(c=>{

list.innerHTML += `

<div>

${c.data().title}

<button onclick="del('${c.id}')">Delete</button>

</div>

`;

});

window.del = async(id)=>{

await deleteDoc(doc(db,"courses",id));

location.reload();

};
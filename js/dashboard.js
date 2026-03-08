import { db } from "./firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const coursesDiv=document.getElementById("courses");

const snap=await getDocs(collection(db,"courses"));

snap.forEach(c=>{

coursesDiv.innerHTML+=`

<div class="mb-3">

<h3>${c.data().title}</h3>

<button onclick="openCourse('${c.id}')">Open</button>

</div>

`;

});

window.openCourse=(id)=>{

window.location=`course.html?id=${id}`;

};

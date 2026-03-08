import { db } from "./firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const coursesDiv = document.getElementById("courses");

async function loadCourses(){

const snapshot = await getDocs(collection(db,"courses"));

snapshot.forEach(docu=>{

const course = docu.data();

coursesDiv.innerHTML += `

<div>

<h3>${course.title}</h3>

<button onclick="goCourse('${docu.id}')">
Open
</button>

</div>

`;

});

}

window.goCourse = (id)=>{

window.location.href=`course-player.html?id=${id}`;

}

loadCourses();
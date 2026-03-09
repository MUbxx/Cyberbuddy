```javascript
import { auth, db } from "./firebase.js";

import {
doc,
getDoc,
collection,
getDocs,
updateDoc,
arrayUnion
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

const moduleList = document.getElementById("moduleList");
const videoPlayer = document.getElementById("videoPlayer");
const lessonTitle = document.getElementById("lessonTitle");

const progressBar = document.getElementById("progressBar");

const markCompleteBtn = document.getElementById("markComplete");

let userId=null;
let currentLesson=null;
let totalLessons=0;
let completedLessons=[];


onAuthStateChanged(auth,async(user)=>{

if(!user){
window.location="login.html";
return;
}

userId=user.uid;

loadCourse();

});


async function loadCourse(){

const courseRef = doc(db,"courses",courseId);
const courseSnap = await getDoc(courseRef);

document.getElementById("courseTitle").innerText =
courseSnap.data().title;

const modules = await getDocs(collection(courseRef,"modules"));

modules.forEach(async module=>{

const moduleTitle=document.createElement("div");

moduleTitle.className="p-4 text-cyan-400 font-bold";

moduleTitle.innerText=module.data().title;

moduleList.appendChild(moduleTitle);

const lessons = await getDocs(
collection(courseRef,"modules",module.id,"lessons")
);

lessons.forEach(lesson=>{

totalLessons++;

const data=lesson.data();

const item=document.createElement("div");

item.className="p-3 text-sm cursor-pointer hover:bg-slate-800";

item.innerText=data.title;

item.onclick=()=>{

videoPlayer.src=data.video;

lessonTitle.innerText=data.title;

currentLesson=lesson.id;

};

moduleList.appendChild(item);

});

});

}



/* MARK LESSON COMPLETE */

markCompleteBtn.onclick=async()=>{

if(!currentLesson) return;

await updateDoc(doc(db,"users",userId),{

[`progress.${courseId}.completedLessons`]:
arrayUnion(currentLesson)

});

completedLessons.push(currentLesson);

updateProgress();

};



/* UPDATE PROGRESS BAR */

function updateProgress(){

const percent=(completedLessons.length/totalLessons)*100;

progressBar.style.width=percent+"%";

}
```

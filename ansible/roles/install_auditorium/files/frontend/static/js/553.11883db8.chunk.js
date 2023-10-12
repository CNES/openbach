"use strict";(self.webpackChunkihm=self.webpackChunkihm||[]).push([[553],{7553:function(e,r,a){a.r(r);var n=a(2791),l=a(1134),s=a(4554),t=a(6151),o=a(4721),i=a(7391),u=a(2460),d=a(5519),f=a(1686),m=a(5346),c=a(5616),v=a(184),h=function(e,r){return!e&&!r||e===r};r.default=function(e){var r=(0,m.v9)((function(e){return e.login})),a=r.username,p=r.first_name,g=r.last_name,x=r.email,w=r.is_user,j=(0,m.I0)(),C=(0,l.cI)(),b=C.control,Z=C.handleSubmit,y=C.reset,N=C.formState.isDirty,B=n.useCallback((function(e){a&&(j((0,f.Nq)({login:a,password:e.password||void 0,first_name:e.firstName,last_name:e.lastName,email:e.email})),y({password:"",passwordVerif:""}))}),[a,y,j]),S=n.useCallback((function(e){var r,a,n,l=[],s=null===e||void 0===e||null===(r=e.password)||void 0===r?void 0:r.message;s&&l.push(s);var t=null===e||void 0===e||null===(a=e.firstName)||void 0===a?void 0:a.message;t&&l.push("First Name "+t);var o=null===e||void 0===e||null===(n=e.lastName)||void 0===n?void 0:n.message;o&&l.push("Last Name "+o),l.length&&j((0,c.PJ)(l.join(" / ")))}),[j]);n.useEffect((function(){j((0,c.Td)("Settings"))}),[j]);var V=[p,g].join(" ").trim(),T=V?"User settings for ".concat(a," (").concat(V,")"):"User settings for "+a;return(0,v.jsxs)(n.Fragment,{children:[(0,v.jsx)("h1",{children:T}),!w&&(0,v.jsx)(s.Z,{component:"p",color:u.Z[500],children:"Your account is not activated yet, please contact your administrator"}),(0,v.jsxs)("form",{onSubmit:Z(B,S),children:[(0,v.jsx)(o.Z,{children:"Profile"}),(0,v.jsx)(l.Qr,{name:"firstName",control:b,rules:{required:!1,maxLength:{value:30,message:"Length is limited to 30 characters"}},defaultValue:p||"",render:function(e){var r=e.field,a=r.onBlur,n=r.onChange,l=r.value,s=r.ref,t=e.fieldState.error;return(0,v.jsx)(i.Z,{fullWidth:!0,variant:"standard",label:"First Name",onChange:n,onBlur:a,value:l,inputRef:s,error:!(null===t||void 0===t||!t.message),helperText:null===t||void 0===t?void 0:t.message})}}),(0,v.jsx)(l.Qr,{name:"lastName",control:b,rules:{required:!1,maxLength:{value:30,message:"Length is limited to 30 characters"}},defaultValue:g||"",render:function(e){var r=e.field,a=r.onBlur,n=r.onChange,l=r.value,s=r.ref,t=e.fieldState.error;return(0,v.jsx)(i.Z,{fullWidth:!0,variant:"standard",label:"Last Name",onChange:n,onBlur:a,value:l,inputRef:s,error:!(null===t||void 0===t||!t.message),helperText:null===t||void 0===t?void 0:t.message})}}),(0,v.jsx)(l.Qr,{name:"email",control:b,rules:{required:!1},defaultValue:x||"",render:function(e){var r=e.field,a=r.onBlur,n=r.onChange,l=r.value,s=r.ref;return(0,v.jsx)(i.Z,{fullWidth:!0,variant:"standard",label:"Email",onChange:n,onBlur:a,value:l,inputRef:s})}}),(0,v.jsx)(o.Z,{sx:{mt:5},children:"Change Password"}),(0,v.jsx)(s.Z,{component:"p",color:d.Z[500],children:"Fill in the following fields only if you want to change your password"}),(0,v.jsx)(l.Qr,{name:"password",control:b,rules:{required:!1,validate:function(e,r){return h(r.password,r.passwordVerif)||"The two passwords do not match"}},defaultValue:"",render:function(e){var r=e.field,a=r.onBlur,n=r.onChange,l=r.value,s=r.ref,t=e.fieldState.error;return(0,v.jsx)(i.Z,{fullWidth:!0,variant:"standard",type:"password",label:"Password",onChange:n,onBlur:a,value:l,inputRef:s,error:!(null===t||void 0===t||!t.message),helperText:null===t||void 0===t?void 0:t.message})}}),(0,v.jsx)(l.Qr,{name:"passwordVerif",control:b,rules:{required:!1,validate:function(e,r){return h(r.password,r.passwordVerif)||"The two passwords do not match"}},defaultValue:"",render:function(e){var r=e.field,a=r.onBlur,n=r.onChange,l=r.value,s=r.ref,t=e.fieldState.error;return(0,v.jsx)(i.Z,{fullWidth:!0,variant:"standard",type:"password",label:"Confirm Password",onChange:n,onBlur:a,value:l,inputRef:s,error:!(null===t||void 0===t||!t.message),helperText:null===t||void 0===t?void 0:t.message})}}),(0,v.jsx)(t.Z,{variant:"contained",color:"secondary",disabled:!N,type:"submit",sx:{mt:5},children:"Modify User Settings"})]})]})}}}]);
//# sourceMappingURL=553.11883db8.chunk.js.map
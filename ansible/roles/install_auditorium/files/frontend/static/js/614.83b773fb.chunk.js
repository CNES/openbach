"use strict";(self.webpackChunkihm=self.webpackChunkihm||[]).push([[614],{3614:function(e,n,a){a.r(n),a.d(n,{default:function(){return Te}});var r=a(2791),t=a(7689),i=a(4554),l=a(3239),o=a(3593),c=a(4835),s=a(1413),u=a(9439),d=a(1134),f=a(6151),h=a(9012),x=a(5523),p=a(493),m=a(4942),v=a(3366),j=a(7462),b=a(8182),g=a(4419),Z=a(2065),y=a(4036),C=a(7278),w=a(3736),k=a(7630),S=a(5878),q=a(1217);function B(e){return(0,q.Z)("MuiSwitch",e)}var V=(0,S.Z)("MuiSwitch",["root","edgeStart","edgeEnd","switchBase","colorPrimary","colorSecondary","sizeSmall","sizeMedium","checked","disabled","input","thumb","track"]),_=a(184),I=["className","color","edge","size","sx"],R=(0,k.ZP)("span",{name:"MuiSwitch",slot:"Root",overridesResolver:function(e,n){var a=e.ownerState;return[n.root,a.edge&&n["edge".concat((0,y.Z)(a.edge))],n["size".concat((0,y.Z)(a.size))]]}})((function(e){var n,a=e.ownerState;return(0,j.Z)({display:"inline-flex",width:58,height:38,overflow:"hidden",padding:12,boxSizing:"border-box",position:"relative",flexShrink:0,zIndex:0,verticalAlign:"middle","@media print":{colorAdjust:"exact"}},"start"===a.edge&&{marginLeft:-8},"end"===a.edge&&{marginRight:-8},"small"===a.size&&(n={width:40,height:24,padding:7},(0,m.Z)(n,"& .".concat(V.thumb),{width:16,height:16}),(0,m.Z)(n,"& .".concat(V.switchBase),(0,m.Z)({padding:4},"&.".concat(V.checked),{transform:"translateX(16px)"})),n))})),z=(0,k.ZP)(C.Z,{name:"MuiSwitch",slot:"SwitchBase",overridesResolver:function(e,n){var a=e.ownerState;return[n.switchBase,(0,m.Z)({},"& .".concat(V.input),n.input),"default"!==a.color&&n["color".concat((0,y.Z)(a.color))]]}})((function(e){var n,a=e.theme;return n={position:"absolute",top:0,left:0,zIndex:1,color:a.vars?a.vars.palette.Switch.defaultColor:"".concat("light"===a.palette.mode?a.palette.common.white:a.palette.grey[300]),transition:a.transitions.create(["left","transform"],{duration:a.transitions.duration.shortest})},(0,m.Z)(n,"&.".concat(V.checked),{transform:"translateX(20px)"}),(0,m.Z)(n,"&.".concat(V.disabled),{color:a.vars?a.vars.palette.Switch.defaultDisabledColor:"".concat("light"===a.palette.mode?a.palette.grey[100]:a.palette.grey[600])}),(0,m.Z)(n,"&.".concat(V.checked," + .").concat(V.track),{opacity:.5}),(0,m.Z)(n,"&.".concat(V.disabled," + .").concat(V.track),{opacity:a.vars?a.vars.opacity.switchTrackDisabled:"".concat("light"===a.palette.mode?.12:.2)}),(0,m.Z)(n,"& .".concat(V.input),{left:"-100%",width:"300%"}),n}),(function(e){var n,a=e.theme,r=e.ownerState;return(0,j.Z)({"&:hover":{backgroundColor:a.vars?"rgba(".concat(a.vars.palette.action.activeChannel," / ").concat(a.vars.palette.action.hoverOpacity,")"):(0,Z.Fq)(a.palette.action.active,a.palette.action.hoverOpacity),"@media (hover: none)":{backgroundColor:"transparent"}}},"default"!==r.color&&(n={},(0,m.Z)(n,"&.".concat(V.checked),(0,m.Z)({color:(a.vars||a).palette[r.color].main,"&:hover":{backgroundColor:a.vars?"rgba(".concat(a.vars.palette[r.color].mainChannel," / ").concat(a.vars.palette.action.hoverOpacity,")"):(0,Z.Fq)(a.palette[r.color].main,a.palette.action.hoverOpacity),"@media (hover: none)":{backgroundColor:"transparent"}}},"&.".concat(V.disabled),{color:a.vars?a.vars.palette.Switch["".concat(r.color,"DisabledColor")]:"".concat("light"===a.palette.mode?(0,Z.$n)(a.palette[r.color].main,.62):(0,Z._j)(a.palette[r.color].main,.55))})),(0,m.Z)(n,"&.".concat(V.checked," + .").concat(V.track),{backgroundColor:(a.vars||a).palette[r.color].main}),n))})),L=(0,k.ZP)("span",{name:"MuiSwitch",slot:"Track",overridesResolver:function(e,n){return n.track}})((function(e){var n=e.theme;return{height:"100%",width:"100%",borderRadius:7,zIndex:-1,transition:n.transitions.create(["opacity","background-color"],{duration:n.transitions.duration.shortest}),backgroundColor:n.vars?n.vars.palette.common.onBackground:"".concat("light"===n.palette.mode?n.palette.common.black:n.palette.common.white),opacity:n.vars?n.vars.opacity.switchTrack:"".concat("light"===n.palette.mode?.38:.3)}})),M=(0,k.ZP)("span",{name:"MuiSwitch",slot:"Thumb",overridesResolver:function(e,n){return n.thumb}})((function(e){var n=e.theme;return{boxShadow:(n.vars||n).shadows[1],backgroundColor:"currentColor",width:20,height:20,borderRadius:"50%"}})),N=r.forwardRef((function(e,n){var a=(0,w.Z)({props:e,name:"MuiSwitch"}),r=a.className,t=a.color,i=void 0===t?"primary":t,l=a.edge,o=void 0!==l&&l,c=a.size,s=void 0===c?"medium":c,u=a.sx,d=(0,v.Z)(a,I),f=(0,j.Z)({},a,{color:i,edge:o,size:s}),h=function(e){var n=e.classes,a=e.edge,r=e.size,t=e.color,i=e.checked,l=e.disabled,o={root:["root",a&&"edge".concat((0,y.Z)(a)),"size".concat((0,y.Z)(r))],switchBase:["switchBase","color".concat((0,y.Z)(t)),i&&"checked",l&&"disabled"],thumb:["thumb"],track:["track"],input:["input"]},c=(0,g.Z)(o,B,n);return(0,j.Z)({},n,c)}(f),x=(0,_.jsx)(M,{className:h.thumb,ownerState:f});return(0,_.jsxs)(R,{className:(0,b.Z)(h.root,r),sx:u,ownerState:f,children:[(0,_.jsx)(z,(0,j.Z)({type:"checkbox",icon:x,checkedIcon:x,ref:n,ownerState:f},d,{classes:(0,j.Z)({},h,{root:h.switchBase})})),(0,_.jsx)(L,{className:h.track,ownerState:f})]})})),W=a(7391),A=a(7381),D=a(565),F=a(6278),O=a(7064),Q=a(9900),J=a(2419),E=a(1563),G=a(5484),P=a(349),T=function(e){var n=e.type,a=e.label,r=e.name,t=e.onDelete;return(0,_.jsxs)(G.ZP,{children:[(0,_.jsx)(O.Z,{onClick:t,sx:{cursor:"pointer"},children:(0,_.jsx)(P.Z,{title:"Remove "+n})}),(0,_.jsxs)(i.Z,{display:"flex",flexDirection:"column",width:"100%",children:[(0,_.jsx)(d.Qr,{name:"".concat(r,".name"),rules:{required:!0},defaultValue:"",render:function(e){var n=e.field,a=n.onChange,r=n.onBlur,t=n.value,i=n.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:"standard",label:"Name",onChange:a,onBlur:r,value:t,inputRef:i,fullWidth:!0})}}),(0,_.jsx)(d.Qr,{name:"".concat(r,".").concat(a.toLowerCase()),rules:{required:!0},defaultValue:"",render:function(e){var n=e.field,r=n.onChange,t=n.onBlur,i=n.value,l=n.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:"standard",label:a,onChange:r,onBlur:t,value:i,inputRef:l,fullWidth:!0})}})]})]})},U=function(e){var n=(0,d.Dq)({name:"arguments"}),a=n.fields,t=n.append,i=n.remove,l=r.useCallback((function(e){return function(){i(e)}}),[i]),o=r.useCallback((function(){t({name:"",description:""})}),[t]),c=a.map((function(e,n){return(0,_.jsx)(T,{name:"arguments.".concat(n),label:"Description",type:"Argument",onDelete:l(n)},e.id)}));return c.push((0,_.jsxs)(F.Z,{onClick:o,children:[(0,_.jsx)(O.Z,{children:(0,_.jsx)(J.Z,{})}),(0,_.jsx)(Q.Z,{primary:"Add new argument"})]},"notAnumber")),(0,_.jsx)(E.Z,{primary:"Arguments",nestedItems:c})},H=function(e){var n=(0,d.Dq)({name:"constants"}),a=n.fields,t=n.append,i=n.remove,l=r.useCallback((function(e){return function(){i(e)}}),[i]),o=r.useCallback((function(){t({name:"",value:""})}),[t]),c=a.map((function(e,n){return(0,_.jsx)(T,{name:"constants.".concat(n),label:"Value",type:"Constant",onDelete:l(n)},e.id)}));return c.push((0,_.jsxs)(F.Z,{onClick:o,children:[(0,_.jsx)(O.Z,{children:(0,_.jsx)(J.Z,{})}),(0,_.jsx)(Q.Z,{primary:"Add new constant"})]},"notAnumber")),(0,_.jsx)(E.Z,{primary:"Constants",nestedItems:c})},X=a(4721),$=a(8096),K=a(4925),Y=a(3786),ee=a(5527),ne=a(9321),ae=a(5987),re=a(3400),te=a(6520),ie=["variant","type","label","sx","fullWidth","step","color"],le=function(e){var n=e.variant,a=e.type,t=e.label,i=e.sx,l=e.fullWidth,o=e.step,c=void 0===o?1:o,u=e.color,f=(0,ae.Z)(e,ie),h=(0,d.Gc)(),x=h.getValues,p=h.setValue,m=f.name,v=r.useCallback((function(){var e=Number(x(m));p(m,isNaN(e)?0:e+c)}),[m,x,p,c]),j=r.useCallback((function(){var e=Number(x(m));p(m,isNaN(e)?0:e-c)}),[m,x,p,c]),b=(0,_.jsx)(te.Z,{title:"Decrement",placement:"top",children:(0,_.jsx)(re.Z,{color:u,onClick:j,children:"-"})}),g=(0,_.jsx)(te.Z,{title:"Increment",placement:"top",children:(0,_.jsx)(re.Z,{color:u,onClick:v,children:"+"})});return(0,_.jsx)(d.Qr,(0,s.Z)((0,s.Z)({},f),{},{render:function(e){var r=e.field,o=r.onChange,c=r.onBlur,s=r.value,d=r.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:n,color:u,fullWidth:l,type:a,label:t,onChange:o,onBlur:c,value:s,inputRef:d,sx:i,InputProps:{startAdornment:b,endAdornment:g}})}}))},oe=a(872),ce=a(9823),se=a(5519),ue=a(7),de=a(2460),fe=a(3433),he=a(1918),xe=a(4454),pe=a(5584),me=["label","password","required"],ve=["label","step","required"],je=["label","onChange","required"],be=["label","choices","required"],ge=["label","type","others","required"],Ze=function(e){var n=e.label,a=e.password,r=(e.required,(0,ae.Z)(e,me));return(0,_.jsx)(d.Qr,(0,s.Z)((0,s.Z)({},r),{},{render:function(e){var r=e.field,t=r.onChange,i=r.onBlur,l=r.value,o=r.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:"standard",type:a?"password":void 0,label:n,onChange:t,onBlur:i,value:l,inputRef:o,sx:{flexGrow:1}})}}))},ye=function(e){var n=e.label,a=e.step,r=(e.required,(0,ae.Z)(e,ve));return(0,_.jsx)(le,(0,s.Z)((0,s.Z)({variant:"standard",label:n,step:a,sx:{flexGrow:1}},r),{},{rules:{required:!1}}))},Ce=function(e){var n=e.label,a=e.onChange,r=(e.required,(0,ae.Z)(e,je));return(0,_.jsx)(h.Z,{sx:{flexGrow:1},children:(0,_.jsx)(x.Z,{control:(0,_.jsx)(d.Qr,(0,s.Z)((0,s.Z)({},r),{},{render:function(e){var n=e.field,r=n.onChange,t=n.onBlur,i=n.value,l=n.ref;return(0,_.jsx)(xe.Z,{checked:i,onChange:a?function(e){r(e),a()}:r,onBlur:t,inputRef:l})}})),label:n})})},we=function(e){var n=e.label,a=e.choices,r=(e.required,(0,ae.Z)(e,be));return(0,_.jsx)(d.Qr,(0,s.Z)((0,s.Z)({},r),{},{render:function(e){var r=e.field,t=r.onChange,i=r.onBlur,l=r.value,o=r.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:"standard",select:!0,label:n,onChange:t,onBlur:i,value:l,inputRef:o,sx:{flexGrow:1},children:[""].concat((0,fe.Z)(a)).map((function(e){return(0,_.jsx)(Y.Z,{value:e,children:e},e)}))})}}))},ke=function(e){var n=e.label,a=e.type,t=e.others,l=(e.required,(0,ae.Z)(e,ge)),o=r.useMemo((function(){return t.filter((function(e){return e.kind===a})).map((function(e){return{id:e.id,label:e.label}}))}),[t,a]);return(0,_.jsxs)($.Z,{size:"small",sx:{flexGrow:1},children:[(0,_.jsx)(K.Z,{children:n}),(0,_.jsx)(d.Qr,(0,s.Z)((0,s.Z)({},l),{},{render:function(e){var a=e.field,r=a.onChange,t=a.onBlur,l=a.value,c=a.ref;return(0,_.jsx)(ne.Z,{label:n,variant:"standard",onChange:r,onBlur:t,value:l,inputRef:c,fullWidth:!0,multiple:!0,renderValue:function(e){return(0,_.jsx)(i.Z,{display:"flex",flexWrap:"wrap",gap:.5,children:e.map((function(e){var n;return(0,_.jsx)(he.Z,{label:null===(n=o.find((function(n){return n.id===e})))||void 0===n?void 0:n.label},e)}))})},children:o.map((function(e){var n=e.id,a=e.label;return(0,_.jsx)(Y.Z,{value:n,children:a},n)}))})}}))]})},Se=function(e){var n=e.name,a=e.label,t=e.defaultValue,i=e.minLength,l=e.maxLength,o=e.type,c=e.password,s=e.choices,u=e.others,f=e.onChange,h=(0,d.Dq)({name:n,shouldUnregister:!1,rules:{minLength:i,maxLength:l}}),x=h.fields,p=h.append,m=(0,d.Gc)(),v=m.getValues,j=m.setValue,b=r.useCallback((function(){p(t),f&&f()}),[p,t,f]);return r.useEffect((function(){var e=v(n);x.length!==(null===e||void 0===e?void 0:e.length)&&j(n,e)}),[n,x,v,j]),(0,_.jsx)(r.Fragment,{children:x.map((function(e,r){var l=r===x.length-1;switch(o){case"None":return(0,_.jsx)(Ce,{label:a,required:r<i,name:"".concat(n,".").concat(r),rules:{required:!1},defaultValue:t,onChange:l?b:f},e.id);case"int":return(0,_.jsx)(ye,{label:a,step:1,required:r<i,name:"".concat(n,".").concat(r),rules:{required:!1},defaultValue:t,onChange:l?b:f},e.id);case"float":return(0,_.jsx)(ye,{label:a,step:.1,required:r<i,name:"".concat(n,".").concat(r),rules:{required:!1},defaultValue:t,onChange:l?b:f},e.id);case"job":return(0,_.jsx)(ke,{label:a,type:"start_job_instance",others:u,required:r<i,name:"".concat(n,".").concat(r),rules:{required:!1},defaultValue:t,onChange:l?b:f},e.id);case"scenario":return(0,_.jsx)(ke,{label:a,type:"start_scenario_instance",others:u,required:r<i,name:"".concat(n,".").concat(r),rules:{required:!1},defaultValue:t,onChange:l?b:f},e.id);default:return s&&s.length?(0,_.jsx)(we,{label:a,choices:s,required:r<i,name:"".concat(n,".").concat(r),rules:{required:!1},defaultValue:t,onChange:l?b:f},e.id):(0,_.jsx)(Ze,{label:a,password:c,required:r<i,name:"".concat(n,".").concat(r),rules:{required:!1},defaultValue:t,onChange:l?b:f},e.id)}}))})},qe=function(e){var n=e.index,a=e.argument,t=e.others,l=e.name,o=e.jobName,c=a.name,s=a.count,f=a.description,h=a.type,x=a.default,p=a.password,m=a.choices,v=a.repeatable,j="functions.".concat(n,".parameters.").concat(o,".").concat(l),b=(0,d.Dq)({name:j,shouldUnregister:!1,rules:{minLength:1,maxLength:v?void 0:1}}),g=b.fields,Z=b.append,y=(0,d.Gc)().getValues,C=r.useMemo((function(){if(!s)return[0,0];var e=Math.max(Number(s),0);if(isNaN(e)){if("*"===s)return[0,void 0];if("+"===s)return[1,void 0];var n=s.split("-"),a=(0,u.Z)(n,2),r=a[0],t=a[1];return t?[Math.max(Number(r),0),Math.max(Number(t),0)].sort():[0,0]}return[e,e]}),[s]),w=(0,u.Z)(C,2),k=w[0],S=w[1],q=r.useMemo((function(){if(x)return x;switch(h){case"None":return!1;case"job":case"scenario":return[];default:return""}}),[h,x]),B=r.useCallback((function(){Z([Array.from({length:Math.max(k,1)},(function(){return q}))])}),[Z,k,q]);return r.useEffect((function(){var e=y(j);null!==e&&void 0!==e&&e.length||B()}),[y,j,B]),(0,_.jsx)(r.Fragment,{children:g.map((function(e,n){return(0,_.jsxs)(i.Z,{display:"flex",flexWrap:"wrap",gap:.5,alignItems:"flex-end",children:[(0,_.jsx)(Se,{name:"".concat(j,".").concat(n),label:c,defaultValue:q,minLength:k,maxLength:S,type:h,password:p,choices:m,others:t,onChange:v&&n===g.length-1?B:void 0}),(0,_.jsx)(te.Z,{title:f,placement:"right",children:(0,_.jsx)(re.Z,{color:"primary",component:"span",children:(0,_.jsx)(pe.Z,{})})})]},e.id)}))})},Be=function e(n){var a,t=n.id,l=n.index,o=n.job,c=n.groups,s=n.others,u=n.arguments,f=(0,d.Gc)().watch,h=r.useCallback((function(e){var n=c.map((function(e){return e.selected}));return n.push(e.name),(0,_.jsx)(qe,{index:l,argument:e,others:s,jobName:o,name:n.join(".")},"".concat(t,".").concat(e.name))}),[t,l,o,s,c]),x=r.useCallback((function(n){var a=n.group_name,i=n.choices,u=n.optional,h=i.map((function(e){var n=e.name;return(0,_.jsx)(Y.Z,{value:n,children:n},n)}));u&&h.unshift((0,_.jsx)(Y.Z,{value:"",sx:{color:"silver"},children:(0,_.jsx)("em",{children:"Clear Choice"})},""));var x=c.map((function(e){return e.name})).join("-"),p=c.map((function(e){var n=e.name,a=e.selected;return"".concat(n,".").concat(a)})).join("."),m="functions.".concat(l,".subcommands.").concat(o,".").concat(p,".").concat(a,".selected"),v=(0,_.jsxs)($.Z,{sx:{minWidth:"198px"},children:[(0,_.jsx)(K.Z,{id:"".concat(t,"-sub-").concat(x,"-").concat(a,"-label"),children:a}),(0,_.jsx)(d.Qr,{name:m,rules:{required:!1},defaultValue:"",render:function(e){var n=e.field,r=n.onChange,i=n.onBlur,l=n.value,o=n.ref;return(0,_.jsx)(ne.Z,{id:"".concat(t,"-sub-").concat(x,"-").concat(a,"-select"),labelId:"".concat(t,"-sub-").concat(x,"-").concat(a,"-label"),label:a,variant:"standard",onChange:r,onBlur:i,value:l,inputRef:o,fullWidth:!0,children:h})}})]},"".concat(t,".").concat(a)),j=f(m);return j?(0,_.jsxs)(r.Fragment,{children:[v,(0,_.jsx)(e,{id:t,index:l,job:o,arguments:i.find((function(e){return e.name===j})),groups:[].concat((0,fe.Z)(c),[{name:a,selected:j}]),others:s})]},a):v}),[t,l,o,s,c,f]),p=u||{},m=p.required,v=void 0===m?[]:m,j=p.optional,b=void 0===j?[]:j,g=v.map(h),Z=b.map(h);null===u||void 0===u||null===(a=u.subcommands)||void 0===a||a.forEach((function(e){e.optional?Z.push(x(e)):g.push(x(e))}));var y=(0,_.jsxs)(r.Fragment,{children:[g.length>0&&(0,_.jsx)("h3",{children:"Required"}),g,Z.length>0&&(0,_.jsx)("h3",{children:"Optional"}),Z]});return c.length>0?(0,_.jsx)(i.Z,{ml:2,children:y}):y},Ve=function(e){var n,a,r,t=e.id,i=e.index,l=e.job,o=e.others;if(!l)return null;if("string"===typeof l)return(0,_.jsxs)("h3",{children:["Selected Job ",l," not found"]});var c=l.arguments,s=l.general.name;return null!==c&&void 0!==c&&null!==(n=c.required)&&void 0!==n&&n.length||null!==c&&void 0!==c&&null!==(a=c.optional)&&void 0!==a&&a.length||null!==c&&void 0!==c&&null!==(r=c.subcommands)&&void 0!==r&&r.length?(0,_.jsx)(Be,{id:t,index:i,job:s,arguments:c,groups:[],others:o}):(0,_.jsxs)("h3",{children:["No arguments for Job ",s]})},_e=a(2050),Ie=a(5346),Re=function(e){var n=e.id,a=e.index,t=e.others,l=(0,Ie.I0)(),o=(0,Ie.v9)((function(e){return e.openbach.jobs})),c=(0,Ie.v9)((function(e){var n;return null===(n=e.project.current)||void 0===n?void 0:n.entity})),s=(0,d.bc)({name:"functions.".concat(a,".entity"),rules:{required:!1},defaultValue:""}).field,f=(0,d.bc)({name:"functions.".concat(a,".job"),rules:{required:!1},defaultValue:""}).field,h=r.useState([]),x=(0,u.Z)(h,2),p=x[0],m=x[1],v=r.useMemo((function(){var e=Object.fromEntries(o.map((function(e){return[e.general.name,!1]})));return p.forEach((function(n){e[n]=!0})),e}),[o,p]);r.useEffect((function(){if(s.value&&c){var e=c.find((function(e){return e.name===s.value}));if(e&&e.agent){var n=e.agent.address,a=l((0,_e.Ly)({address:n}));return a.unwrap().then((function(e){m(e)})),function(){a.abort()}}}m([])}),[s.value,c,l]);var j=null===o||void 0===o?void 0:o.find((function(e){return e.general.name===f.value}));return(0,_.jsxs)(r.Fragment,{children:[(0,_.jsx)("h3",{children:"Starting Job"}),(0,_.jsxs)(i.Z,{display:"flex",gap:"6%",children:[(0,_.jsxs)($.Z,{sx:{width:"47%"},children:[(0,_.jsx)(K.Z,{id:"".concat(n,"-entity-label"),children:"Entity Name"}),(0,_.jsx)(ne.Z,{id:"".concat(n,"-entity-select"),labelId:"".concat(n,"-entity-label"),label:"Entity Name",variant:"standard",onChange:s.onChange,onBlur:s.onBlur,value:s.value,inputRef:s.ref,fullWidth:!0,children:null===c||void 0===c?void 0:c.map((function(e){var n=e.name;return(0,_.jsx)(Y.Z,{value:n,children:n},n)}))})]}),(0,_.jsxs)($.Z,{sx:{width:"47%"},children:[(0,_.jsx)(K.Z,{id:"".concat(n,"-job-label"),children:"Job"}),(0,_.jsx)(ne.Z,{id:"".concat(n,"-job-select"),labelId:"".concat(n,"-job-label"),label:"Job",variant:"standard",onChange:f.onChange,onBlur:f.onBlur,value:f.value,inputRef:f.ref,renderValue:function(e){return(0,_.jsx)("span",{children:e})},fullWidth:!0,children:null===o||void 0===o?void 0:o.map((function(e){var n=e.general.name;return(0,_.jsxs)(Y.Z,{value:n,sx:{color:v[n]?"inherit":se.Z[500]},children:[(0,_.jsx)(O.Z,{children:v[n]?(0,_.jsx)(oe.Z,{sx:{color:ue.Z[500]}}):(0,_.jsx)(ce.Z,{sx:{color:de.Z[500]}})}),(0,_.jsx)(Q.Z,{children:n})]},n)}))})]})]}),(0,_.jsxs)("div",{children:[(0,_.jsx)(i.Z,{component:"p",display:"inline",mr:"10px",children:"Optionally, the agent will run the job after"}),(0,_.jsx)(le,{variant:"standard",label:"Offset",sx:{verticalAlign:"baseline"},step:.1,name:"functions.".concat(a,".offset"),rules:{required:!1},defaultValue:""}),(0,_.jsx)(i.Z,{component:"p",display:"inline",mx:"10px",children:"seconds when the function is started. It will also reschedule it every"}),(0,_.jsx)(le,{variant:"standard",label:"Interval",sx:{verticalAlign:"baseline"},step:.1,name:"functions.".concat(a,".interval"),rules:{required:!1},defaultValue:""}),(0,_.jsx)(i.Z,{component:"p",display:"inline",ml:"10px",children:"seconds after the beginning of its first run."})]}),(0,_.jsx)(X.Z,{sx:{my:1}}),(0,_.jsx)(Ve,{id:n,index:a,job:j||f.value,others:t})]})},ze=function(e){var n=e.id,a=e.index,t=e.others,l=(0,d.bc)({name:"functions.".concat(a,".jobs"),rules:{required:!1},defaultValue:[]}).field,o=l.onChange,c=l.onBlur,s=l.value,u=l.ref,f=r.useCallback((function(e){var n=e.target.value;o("string"===typeof n?[]:n)}),[o]);return(0,_.jsxs)(r.Fragment,{children:[(0,_.jsx)("h3",{children:"Stopping Jobs"}),(0,_.jsxs)($.Z,{size:"small",sx:{width:"100%"},children:[(0,_.jsx)(K.Z,{id:"".concat(n,"-scenario-id-label"),children:"Jobs"}),(0,_.jsx)(ne.Z,{id:"".concat(n,"-scenario-id-select"),labelId:"".concat(n,"-scenario-id-label"),label:"Jobs",variant:"standard",value:s,onChange:f,onBlur:c,inputRef:u,fullWidth:!0,multiple:!0,renderValue:function(e){return(0,_.jsx)(i.Z,{sx:{display:"flex",flexWrap:"wrap",gap:.5},children:e.map((function(e){var n;return(0,_.jsx)(he.Z,{label:null===(n=t.find((function(n){return n.id===e})))||void 0===n?void 0:n.label},e)}))})},children:t.filter((function(e){return"start_job_instance"===e.kind})).map((function(e){var n=e.id,a=e.label;return(0,_.jsx)(Y.Z,{value:n,children:a},n)}))})]})]})},Le=function(e){var n=e.id,a=e.index,t=e.scenarios,i=(0,d.bc)({name:"functions.".concat(a,".scenario"),rules:{required:!1},defaultValue:""}).field,l=i.onChange,o=i.onBlur,c=i.value,s=i.ref,f=t.find((function(e){return e.name===c}));return(0,_.jsxs)(r.Fragment,{children:[(0,_.jsx)("h3",{children:"Starting Scenario"}),(0,_.jsxs)($.Z,{sx:{width:"100%"},children:[(0,_.jsx)(K.Z,{id:"".concat(n,"-scenario-label"),children:"Scenario"}),(0,_.jsx)(ne.Z,{id:"".concat(n,"-scenario-select"),labelId:"".concat(n,"-scenario-label"),label:"Scenario",variant:"standard",onChange:l,onBlur:o,value:c,inputRef:s,fullWidth:!0,children:t.map((function(e){var n=e.name;return(0,_.jsx)(Y.Z,{value:n,children:n},n)}))})]}),f&&Object.entries(f.arguments||{}).map((function(e){var r=(0,u.Z)(e,2),t=r[0],i=r[1];return(0,_.jsx)(d.Qr,{name:"functions.".concat(a,".scenarioArguments.").concat(c,".").concat(t),rules:{required:!1},defaultValue:"",render:function(e){var a=e.field,r=a.onChange,l=a.onBlur,o=a.value,c=a.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:"standard",label:t,helperText:i,onChange:r,onBlur:l,value:o,inputRef:c,fullWidth:!0},"".concat(n,".scenarioArguments.").concat(o,".").concat(t))}})}))]})},Me=function(e){var n=e.id,a=e.index,t=e.others;return(0,_.jsxs)(r.Fragment,{children:[(0,_.jsx)("h3",{children:"Stopping Scenario"}),(0,_.jsxs)($.Z,{sx:{width:"100%"},children:[(0,_.jsx)(K.Z,{id:"".concat(n,"-scenario-id-label"),children:"Scenario"}),(0,_.jsx)(d.Qr,{name:"functions.".concat(a,".scenarioId"),rules:{required:!1},defaultValue:NaN,render:function(e){var a=e.field,r=a.onChange,i=a.onBlur,l=a.value,o=a.ref;return(0,_.jsx)(ne.Z,{id:"".concat(n,"-scenario-id-select"),labelId:"".concat(n,"-scenario-id-label"),label:"Scenario",variant:"standard",onChange:r,onBlur:i,value:l,inputRef:o,fullWidth:!0,children:t.filter((function(e){return"start_scenario_instance"===e.kind})).map((function(e){var n=e.id,a=e.label;return(0,_.jsx)(Y.Z,{value:n,children:a},n)}))})}})]})]})},Ne=["awaitables","label"],We=function(e){var n=e.awaitables,a=e.label,t=(0,ae.Z)(e,Ne),l=(0,d.bc)(t).field,o=l.onChange,c=l.onBlur,s=l.value,u=l.ref,f=r.useCallback((function(e){var n=e.target.value;o("string"===typeof n?[]:n)}),[o]);return(0,_.jsxs)($.Z,{size:"small",sx:{display:"flex",mx:2,gap:2,flexDirection:"row",alignItems:"center"},children:[(0,_.jsx)(ne.Z,{value:s,onChange:f,onBlur:c,inputRef:u,fullWidth:!0,multiple:!0,renderValue:function(e){return(0,_.jsx)(i.Z,{sx:{display:"flex",flexWrap:"wrap",gap:.5},children:e.map((function(e){var a;return(0,_.jsx)(he.Z,{label:null===(a=n.find((function(n){return n.id===e})))||void 0===a?void 0:a.label},e)}))})},sx:{width:"70%"},children:n.map((function(e){var n=e.id,a=e.label;return(0,_.jsx)(Y.Z,{value:n,children:a},n)}))}),(0,_.jsx)("p",{children:a})]})},Ae=["start_job_instance","stop_job_instances","start_scenario_instance","stop_scenario_instance"],De=a(9149),Fe=function(e,n){var a=e.label,r=e.kind,t=e.jobs,i=e.scenarioId,l=e.job,o=void 0===l?"no job configured":l,c=e.entity,s=void 0===c?"unkonwn entity":c,u=e.scenario,d=void 0===u?"no scenario configured":u,f=a?"[".concat(a,"] "):"";switch(r){case void 0:case"":return f+"Not selected yet";case"start_job_instance":return f+"Start Job Instance: "+o+" on "+s;case"stop_job_instances":if(!t||!t.length)return f+"Stop Job Instance";var h=t.length>1?"s: ":": ",x=t.map((function(e){return(0,De.eM)(e,n)})).join(", ");return f+"Stop Job Instance"+h+x;case"start_scenario_instance":return f+"Start Scenario Instance: "+d;case"stop_scenario_instance":return f+"Stop Scenario Instance: "+(null==i?"no scenario configured":(0,De.eM)(i,n));default:return f+"Uneditable OpenBach Function: "+r}},Oe=function(e,n){var a=e.wait;if(!a)return"Started immediately";var r=function(e,a){if(!a||!a.length)return"";var r=a.map((function(e){return(0,De.eM)(e,n)})),t=r.length;return t>1&&(r[t-1]="and "+r[t-1]),"".concat(r.join(t>2?", ":" ")," ").concat(t>1?"are":"is"," ").concat(e)},t=a.time,i=a.running_ids,l=a.ended_ids,o=a.launched_ids,c=a.finished_ids,s=t?"".concat(t," seconds"):"immediately",u=[r("running",i),r("ended",l),r("started",o),r("finished",c)].filter((function(e){return Boolean(e)})),d=u.length;return d?(d>1&&(u[d-1]="and "+u[d-1]),"Started "+s+" after "+u.join(d>2?", ":" ")):"Started ".concat(s," in")},Qe=function(e){var n=e.scenario,a=(0,Ie.v9)((function(e){return e.project.current})),t=(0,d.Gc)().getValues,l=(0,d.Dq)({name:"functions"}),o=l.fields,c=l.append,s=l.remove,f=r.useState({}),h=(0,u.Z)(f,2)[1],x=r.useMemo((function(){return a?a.scenario.filter((function(e){return e.name!==n})):[]}),[n,a]),p=r.useCallback((function(){var e=parseInt("xxxxxxxx".replace(/[x]/g,(function(e){var n=16*Math.random()|0;return("x"===e?n:3&n|8).toString(16)})),16);c({id:e,parameters:{}})}),[c]),m=r.useCallback((function(e){return function(){s(e)}}),[s]),v=r.useCallback((function(){h({})}),[]),j=t("functions");return(0,_.jsxs)(r.Fragment,{children:[(null===j||void 0===j?void 0:j.length)>0&&o.map((function(e,n){var a,r,t=e.id,l=j[n];console.log(l);var o=j.filter((function(e,a){return e.label&&n!==a}));return(0,_.jsx)(E.Z,{leftIcon:(0,_.jsx)(P.Z,{title:"Delete this OpenBACH function"}),onLeftClick:m(n),primary:Fe(l,o),secondary:Oe(l,o),nestedItems:(0,_.jsxs)(ee.Z,{sx:{px:"2%",py:2},children:[(0,_.jsxs)(i.Z,{display:"flex",gap:"2%",alignItems:"top",children:[(0,_.jsx)(i.Z,{width:"32%",children:(0,_.jsx)(d.Qr,{name:"functions.".concat(n,".label"),rules:{required:!1},defaultValue:"",render:function(e){var n=e.field,a=n.onChange,r=n.onBlur,t=n.value,i=n.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:"standard",label:"Label",onChange:a,onBlur:r,value:t,inputRef:i,fullWidth:!0})}})}),(0,_.jsxs)(i.Z,{width:"32%",children:[(0,_.jsxs)($.Z,{sx:{mt:1,width:"100%"},children:[(0,_.jsx)(K.Z,{id:"".concat(t,"-fail-label"),sx:{mt:1},children:"Fail Policy"}),(0,_.jsx)(d.Qr,{name:"functions.".concat(n,".on_fail.policy"),rules:{required:!1},defaultValue:"",render:function(e){var n=e.field,a=n.onChange,r=n.onBlur,i=n.value,l=n.ref;return(0,_.jsxs)(ne.Z,{id:"".concat(t,"-fail-select"),labelId:"".concat(t,"-fail-label"),label:"Fail Policy",variant:"standard",onChange:a,onBlur:r,value:i,inputRef:l,fullWidth:!0,children:[(0,_.jsx)(Y.Z,{value:"Fail",children:"Fail"}),(0,_.jsx)(Y.Z,{value:"Ignore",children:"Ignore"}),(0,_.jsx)(Y.Z,{value:"Retry",children:"Retry"})]})}})]}),"Retry"===(null===(a=l.on_fail)||void 0===a?void 0:a.policy)&&(0,_.jsx)(le,{variant:"standard",label:"Retry Limit",fullWidth:!0,name:"functions.".concat(n,".on_fail.retry"),rules:{required:!1},defaultValue:""}),"Retry"===(null===(r=l.on_fail)||void 0===r?void 0:r.policy)&&(0,_.jsx)(le,{variant:"standard",label:"Retry Delay",fullWidth:!0,step:.1,name:"functions.".concat(n,".on_fail.delay"),rules:{required:!1},defaultValue:""})]}),(0,_.jsxs)($.Z,{sx:{width:"32%",mt:1},children:[(0,_.jsx)(K.Z,{id:"".concat(t,"-kind-label"),sx:{mt:1},children:"Openbach Function"}),(0,_.jsx)(d.Qr,{name:"functions.".concat(n,".kind"),rules:{required:!0},defaultValue:"",render:function(e){var n=e.field,a=n.onChange,r=n.onBlur,i=n.value,l=n.ref;return(0,_.jsx)(ne.Z,{id:"".concat(t,"-kind-select"),labelId:"".concat(t,"-kind-label"),label:"Openbach Function",variant:"standard",onChange:function(e){a(e),v()},onBlur:r,value:i,inputRef:l,fullWidth:!0,children:Ae.map((function(e){return(0,_.jsx)(Y.Z,{value:e,children:e},e)}))})}})]})]}),(0,_.jsxs)(i.Z,{children:[(0,_.jsx)(i.Z,{component:"p",display:"inline",mr:"10px",children:"The controller will start this function"}),(0,_.jsx)(le,{variant:"standard",label:"Waiting Time",sx:{verticalAlign:"baseline"},step:.1,name:"functions.".concat(n,".wait.time"),rules:{required:!1},defaultValue:""}),(0,_.jsx)(i.Z,{component:"p",display:"inline",ml:"10px",children:"seconds after"})]}),(0,_.jsxs)(i.Z,{mt:"5px",mb:"15px",children:[(0,_.jsx)(We,{awaitables:o,label:"openbach functions are first running and",name:"functions.".concat(n,".wait.running_ids"),rules:{required:!1},defaultValue:[]}),(0,_.jsx)(We,{awaitables:o,label:"openbach functions are ended and",name:"functions.".concat(n,".wait.ended_ids"),rules:{required:!1},defaultValue:[]}),(0,_.jsx)(We,{awaitables:o,label:"jobs/scenarios are started and",name:"functions.".concat(n,".wait.launched_ids"),rules:{required:!1},defaultValue:[]}),(0,_.jsx)(We,{awaitables:o,label:"jobs/scenarios are finished.",name:"functions.".concat(n,".wait.finished_ids"),rules:{required:!1},defaultValue:[]})]}),(0,_.jsx)(X.Z,{sx:{my:1}}),null==l.kind&&(0,_.jsx)(i.Z,{component:"h3",children:"Unselected Openbach Function"}),!Ae.includes(l.kind)&&(0,_.jsx)(i.Z,{component:"h3",children:l.kind}),"start_job_instance"===l.kind&&(0,_.jsx)(Re,{id:t,index:n,others:o}),"stop_job_instances"===l.kind&&(0,_.jsx)(ze,{id:t,index:n,others:o}),"start_scenario_instance"===l.kind&&(0,_.jsx)(Le,{id:t,index:n,scenarios:x}),"stop_scenario_instance"===l.kind&&(0,_.jsx)(Me,{id:t,index:n,others:o})]})},t)})),(0,_.jsxs)(F.Z,{onClick:p,children:[(0,_.jsx)(O.Z,{children:(0,_.jsx)(J.Z,{})}),(0,_.jsx)(Q.Z,{primary:"Add new OpenBACH function"})]})]})},Je=a(808),Ee=a(4950),Ge=function(e){var n=e.project,a=e.scenario,t=(0,Ie.v9)((function(e){return e.login.favorites})),o=(0,Ie.v9)((function(e){return e.form[a]})),c=(0,Ie.I0)(),m=(0,d.cI)({mode:"onBlur"}),v=m.handleSubmit,j=m.reset,b=m.formState,g=b.isValid,Z=b.isDirty,y=r.useState(!1),C=(0,u.Z)(y,2),w=C[0],k=C[1],S=r.useMemo((function(){var e;return Boolean(null===(e=t[n])||void 0===e?void 0:e.includes(a))}),[n,a,t]),q=r.useCallback((function(){k(!0)}),[]),B=r.useCallback((function(){k(!1)}),[]),V=r.useCallback((function(e){var r=e.target.checked;c((0,Ee.W1)({project:n,scenario:a,favorite:r}))}),[n,a,c]),I=r.useCallback((function(e){var a=JSON.parse(e);c((0,Ee.CQ)({project:n,scenario:a}))}),[n,c]),R=r.useCallback((function(e){c((0,Ee.kl)({project:n,name:a,form:e}))}),[n,a,c]);if(r.useEffect((function(){o&&j(o.form)}),[o,j]),!o)return(0,_.jsxs)(i.Z,{display:"flex",alignItems:"center",flexDirection:"column",children:[(0,_.jsx)(l.Z,{}),(0,_.jsx)("p",{children:"Loading jobs, please wait!"})]});var z=o.form.arguments;return(0,_.jsxs)(r.Fragment,{children:[(0,_.jsx)(d.RV,(0,s.Z)((0,s.Z)({},m),{},{children:(0,_.jsxs)("form",{onSubmit:v(R),children:[(0,_.jsxs)(i.Z,{m:"0px 8px",children:[(0,_.jsx)(d.Qr,{name:"description",rules:{required:!1},defaultValue:"",render:function(e){var n=e.field,a=n.onChange,r=n.onBlur,t=n.value,i=n.ref;return(0,_.jsx)(W.Z,{margin:"dense",variant:"standard",label:"Description",onChange:a,onBlur:r,value:t,inputRef:i,fullWidth:!0,multiline:!0})}}),(0,_.jsxs)(i.Z,{display:"flex",gap:"8px",m:"30px 0",justifyContent:"center",children:[(0,_.jsx)(h.Z,{children:(0,_.jsx)(x.Z,{control:(0,_.jsx)(N,{checked:S,onChange:V}),label:"Favorite"})}),(0,_.jsx)(D.Z,{label:"Scenario",initial:o.initial,onUpdate:I}),(0,_.jsx)(A.Z,{route:"/project/".concat(n,"/scenario/").concat(a),filename:"".concat(a,".json"),label:"Scenario",disabled:Z}),(0,_.jsx)(f.Z,{type:"submit",variant:"contained",color:"secondary",disabled:!g||!Z,children:"Save"}),(0,_.jsx)(f.Z,{variant:"contained",color:"secondary",disabled:Z,onClick:q,children:"Launch"})]})]}),(0,_.jsxs)(p.Z,{children:[(0,_.jsx)(U,{}),(0,_.jsx)(H,{}),(0,_.jsx)(Qe,{scenario:a})]}),(0,_.jsx)(i.Z,{marginTop:"5px",textAlign:"center",children:(0,_.jsx)(f.Z,{type:"submit",variant:"contained",color:"secondary",disabled:!g||!Z,children:"Save"})})]})})),w&&(0,_.jsx)(Je.Z,{project:n,scenario:a,arguments:Object.keys(z),onClose:B})]})},Pe=a(4498),Te=function(e){var n=(0,t.UO)(),a=n.projectId,s=n.scenarioId,u=(0,Ie.v9)((function(e){return e.project.current})),d=(0,Ie.v9)((function(e){return e.openbach.jobs})),f=(0,Ie.I0)(),h=r.useMemo((function(){if(u)return u.scenario.find((function(e){return e.name===s}))}),[u,s]);return r.useEffect((function(){h&&d&&f((0,Pe.R)({scenario:h,jobs:d}))}),[h,d,f]),a&&s?u?h?d?(0,_.jsxs)(r.Fragment,{children:[(0,_.jsxs)(i.Z,{display:"inline-block",width:"70%",sx:{verticalAlign:"top"},children:[(0,_.jsxs)("h1",{children:["Scenario ",s]}),(0,_.jsx)(Ge,{project:a,scenario:s})]}),(0,_.jsxs)(i.Z,{display:"inline-block",width:"30%",sx:{verticalAlign:"top"},children:[(0,_.jsx)("h1",{children:"Instances"}),(0,_.jsx)(c.Z,{project:a,scenario:s})]})]}):(0,_.jsxs)(i.Z,{display:"flex",alignItems:"center",flexDirection:"column",children:[(0,_.jsx)(l.Z,{}),(0,_.jsx)("p",{children:"Loading jobs list"})]}):(0,_.jsxs)(i.Z,{display:"flex",alignItems:"center",flexDirection:"column",children:[(0,_.jsx)(o.Z,{color:"error",fontSize:"large"}),(0,_.jsxs)("p",{children:["Project ",a," does not contain a scenario named ",s]})]}):(0,_.jsxs)(i.Z,{display:"flex",alignItems:"center",flexDirection:"column",children:[(0,_.jsx)(l.Z,{}),(0,_.jsxs)("p",{children:["Loading project ",a]})]}):null}},2419:function(e,n,a){var r=a(4836);n.Z=void 0;var t=r(a(5649)),i=a(184),l=(0,t.default)((0,i.jsx)("path",{d:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"}),"Add");n.Z=l},9823:function(e,n,a){var r=a(4836);n.Z=void 0;var t=r(a(5649)),i=a(184),l=(0,t.default)((0,i.jsx)("path",{d:"M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"}),"Close");n.Z=l},5584:function(e,n,a){var r=a(4836);n.Z=void 0;var t=r(a(5649)),i=a(184),l=(0,t.default)((0,i.jsx)("path",{d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"}),"Info");n.Z=l},3593:function(e,n,a){var r=a(4836);n.Z=void 0;var t=r(a(5649)),i=a(184),l=(0,t.default)([(0,i.jsx)("path",{d:"m18.49 9.89.26-2.79-2.74-.62-1.43-2.41L12 5.18 9.42 4.07 7.99 6.48l-2.74.62.26 2.78L3.66 12l1.85 2.11-.26 2.8 2.74.62 1.43 2.41L12 18.82l2.58 1.11 1.43-2.41 2.74-.62-.26-2.79L20.34 12l-1.85-2.11zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z",opacity:".3"},"0"),(0,i.jsx)("path",{d:"m20.9 5.54-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12l-2.44-2.78.34-3.68zM18.75 16.9l-2.74.62-1.43 2.41L12 18.82l-2.58 1.11-1.43-2.41-2.74-.62.26-2.8L3.66 12l1.85-2.12-.26-2.78 2.74-.61 1.43-2.41L12 5.18l2.58-1.11 1.43 2.41 2.74.62-.26 2.79L20.34 12l-1.85 2.11.26 2.79zM11 15h2v2h-2zm0-8h2v6h-2z"},"1")],"NewReleasesTwoTone");n.Z=l}}]);
//# sourceMappingURL=614.83b773fb.chunk.js.map
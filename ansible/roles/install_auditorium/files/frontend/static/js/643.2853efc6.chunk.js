"use strict";(self.webpackChunkihm=self.webpackChunkihm||[]).push([[643],{4643:function(e,n,t){t.r(n),t.d(n,{default:function(){return C}});var a=t(3433),c=t(9439),i=t(2791),r=t(4554),s=t(6151),l=t(493),o=t(4454),u=t(9012),d=t(5523),f=t(5484),h=t(6278),x=t(7064),b=t(9900),k=t(184),m=function(e){var n=e.user,t=e.onToggleDelete,a=e.onUserChange,r=n.username,s=n.is_user,l=n.is_admin,m=i.useState(!1),g=(0,c.Z)(m,2),p=g[0],Z=g[1],C=i.useState(s),j=(0,c.Z)(C,2),v=j[0],y=j[1],A=i.useState(l),S=(0,c.Z)(A,2),D=S[0],R=S[1],w=i.useCallback((function(){t(),Z((function(e){return!e}))}),[t]),T=i.useCallback((function(e){t(),Z(e.target.checked)}),[t]),U=i.useCallback((function(e){var n=e.target.checked;a(n,D),y(n)}),[a,D]),O=i.useCallback((function(e){var n=e.target.checked,t=n||v;a(t,n),y(t),R(n)}),[a,v]),P="checkbox-list-label-".concat(r);return(0,k.jsx)(f.ZP,{secondaryAction:(0,k.jsxs)(u.Z,{sx:{display:"flex",flexDirection:"row"},children:[(0,k.jsx)(d.Z,{disabled:D,control:(0,k.jsx)(o.Z,{disableRipple:!0,checked:v,onChange:U}),label:"Active",sx:{mr:10}}),(0,k.jsx)(d.Z,{control:(0,k.jsx)(o.Z,{disableRipple:!0,checked:D,onChange:O}),label:"Admin",sx:{mr:10}})]}),children:(0,k.jsxs)(h.Z,{role:void 0,onClick:w,children:[(0,k.jsx)(x.Z,{children:(0,k.jsx)(o.Z,{edge:"start",checked:p,disableRipple:!0,inputProps:{"aria-labelledby":P},onChange:T})}),(0,k.jsx)(b.Z,{id:P,primary:r})]})})},g=t(5346),p=t(5616),Z=t(1686),C=function(e){var n=i.useState([]),t=(0,c.Z)(n,2),o=t[0],u=t[1],d=i.useState([]),f=(0,c.Z)(d,2),h=f[0],x=f[1],b=(0,g.v9)((function(e){return e.users.users})),C=(0,g.I0)(),j=i.useCallback((function(e){return function(){u((function(n){var t=n.indexOf(e);return t<0?[].concat((0,a.Z)(n),[e]):n.slice(0,t).concat(n.slice(t+1))}))}}),[]),v=i.useCallback((function(e){return function(n,t){x((function(a){var c=!1,i=a.map((function(a){return a.login===e?(c=!0,{login:e,active:n,admin:t}):a}));return c||i.push({login:e,active:n,admin:t}),i}))}}),[]),y=i.useCallback((function(){C((0,Z.Vt)({usernames:o})),u([]),x([])}),[C,o]),A=i.useCallback((function(){C((0,Z.eD)({permissions:h})),u([]),x([])}),[C,h]);i.useEffect((function(){C((0,p.Td)("OpenBach Administration"));var e=C((0,Z.Rf)());return function(){e.abort()}}),[C]);var S=b.map((function(e){return(0,k.jsx)(m,{user:e,onToggleDelete:j(e.username),onUserChange:v(e.username)},e.username)}));return(0,k.jsxs)(i.Fragment,{children:[(0,k.jsx)(l.Z,{children:S}),(0,k.jsxs)(r.Z,{m:5,textAlign:"right",children:[(0,k.jsx)(s.Z,{variant:"contained",color:"secondary",onClick:y,disabled:!o.length,sx:{m:5},children:"Delete Selected Users"}),(0,k.jsx)(s.Z,{variant:"contained",color:"secondary",onClick:A,disabled:!h.length,sx:{m:5},children:"Apply Modifications"})]})]})}}}]);
//# sourceMappingURL=643.2853efc6.chunk.js.map
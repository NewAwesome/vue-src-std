
// eslint-disable-next-line no-undef
new Vue({    
    el:".a",
    data(){        
        return {            
            name:1
        }
    },    
    methods:{
        getName(){            
            this.name="修改----我是父组件a"
        },
    },
})
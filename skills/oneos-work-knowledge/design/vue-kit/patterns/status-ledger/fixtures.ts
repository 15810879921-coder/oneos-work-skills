// Frozen presentation inputs. Business services remain in their own modules.
export const statusLedgerFixtures = {
  customer: {
    primary: [
      { label: '客户名称', placeholder: '搜索客户名称', kind: 'search' },
      { label: '客户类型', placeholder: '全部类型', kind: 'select' },
      { label: '业务部门', placeholder: '全部业务部门', kind: 'select' },
      { label: '业务员', placeholder: '全部业务员', kind: 'select', showSearch: true },
    ],
    advanced: [
      ['通讯地址所在省', '全部省份'], ['通讯地址所在市', '全部城市'],
      ['正式建档状态', '全部状态'], ['资料状态', '全部资料状态'],
      ['安全评级', '全部评级'], ['财务评级', '全部评级'], ['法务评级', '全部评级'],
    ].map(([label, placeholder]) => ({ label, placeholder, kind: 'select', disabled: label === '通讯地址所在市' })),
    tabs: ['全部','合作中','待交付','待结清','签约中','已结束','待合作','待核实'].map((label,i) => ({key: String(i), label, count: i === 0 || i === 7 ? 11 : 0})),
  },
  lease: {
    primary: ['合同编号','项目名称','客户名称'].map(label => ({label,placeholder: `输入${label}`,kind:'input'})),
    advanced: ['合同状态','审核状态','签约公司','模板类别','标准合同名称','业务部门','业务员','审批类型','创建人','到期开始日期','到期结束日期','签署资料归档','盖章合同上传','业务员交接'].map((label,i) => ({label,placeholder: i === 9 || i === 10 ? '请选择日期' : '全部',kind: i === 9 || i === 10 ? 'date' : i >= 2 && i <= 8 ? 'multiple' : 'select', disabled: false})),
    tabs: ['全部合同','草稿','待生效','进行中','已终止','其他状态'].map((label,i) => ({key:String(i),label,count:[26,9,9,8,0,0][i]})),
  },
  replacement: {
    primary: [
      {label:'替换日期',placeholder:['替换开始日期','结束日期'],kind:'range'},
      {label:'替换类型',placeholder:'全部替换类型',kind:'select'},
      {label:'项目名称',placeholder:'全部项目',kind:'select',showSearch:true},
      {label:'审批状态',placeholder:'全部审批状态',kind:'multiple'},
    ],
    advanced: [
      {label:'原车车牌号',placeholder:'请输入或选择车牌号',kind:'select',showSearch:true},
      {label:'新车车牌号',placeholder:'请输入或选择车牌号',kind:'select',showSearch:true},
      {label:'替换原因',placeholder:'请选择',kind:'select'},
      {label:'创建人',placeholder:'请选择创建人',kind:'select',showSearch:true},
      {label:'创建时间',placeholder:['开始日期','结束日期'],kind:'range'},
      {label:'客户名称',placeholder:'请选择或输入客户名称',kind:'select',showSearch:true},
      {label:'合同编号',placeholder:'请选择或输入合同编号',kind:'select',showSearch:true},
      {label:'区域',placeholder:'请选择省-市',kind:'cascader',showSearch:true},
      {label:'旧车交车时间',placeholder:['开始日期','结束日期'],kind:'range'},
      {label:'新车交车时间',placeholder:['开始日期','结束日期'],kind:'range'},
    ],
    tabs:[{key:'all',label:'全部',count:360},{key:'ongoing',label:'进行中',count:18},{key:'history',label:'历史记录',count:342}],
  },
  pickup: {
    primary:[
      {label:'关键词',placeholder:'单据 / 客户 / 合同 / 项目 / 车牌',kind:'search'},
      {label:'客户',placeholder:'全部客户',kind:'select',showSearch:true,allowClear:false,defaultValue:'',defaultLabel:'全部客户'},
      {label:'所属项目',placeholder:'全部项目',kind:'select',showSearch:true,allowClear:false,defaultValue:'',defaultLabel:'全部项目'},
    ],
    advanced:[
      ...['应收审批','财务到账','匹配状态','并账状态'].map(label=>({label,kind:'select',allowClear:false,defaultValue:'',defaultLabel:'全部'})),
      {label:'提车日期',placeholder:['开始日期','结束日期'],kind:'range'},
      {label:'合同编号',kind:'input'},
      {label:'车牌',kind:'input',number:true},
      {label:'创建人',kind:'select',allowClear:false,defaultValue:'',defaultLabel:'全部创建人'},
      {label:'创建时间',placeholder:['开始日期','结束日期'],kind:'range'},
    ],tabs:[],title:'共 2 份合同',
  },
  billing: {
    primary:[
      {label:'费用所属月',kind:'month',defaultValue:'2026-10',allowClear:false},
      {label:'查询关键词',kind:'input',placeholder:'项目名称或合同号'},
    ],
    advanced:[],
    tabs:[{key:'customer',label:'客户视图'},{key:'project',label:'项目视图'},{key:'vehicle',label:'车辆视图'}],
    activeKey:'project',
  },
  return: {
    primary:[
      {label:'合同编号',kind:'select',placeholder:'请选择或输入合同编号',showSearch:true},
      {label:'客户名称',kind:'select',placeholder:'请选择或输入客户名称',showSearch:true},
    ],
    advanced:[
      {label:'精准客户名称',kind:'select',placeholder:'请选择精准客户名称',showSearch:true},
      {label:'项目名称',kind:'select',placeholder:'请选择或输入项目名称',showSearch:true},
      {label:'审批状态',kind:'select',placeholder:'请选择审批状态'},
      {label:'车牌号',kind:'select',placeholder:'请选择或输入车牌号',showSearch:true},
      {label:'还车时间',kind:'range',placeholder:['请选择开始日期','请选择结束日期']},
      {label:'业务部门',kind:'select',placeholder:'请选择或输入业务部门',showSearch:true},
      {label:'业务负责人',kind:'select',placeholder:'请选择或输入业务负责人',showSearch:true},
      {label:'还车运维人',kind:'select',placeholder:'请选择或输入还车运维人',showSearch:true},
      {label:'业务管理组',kind:'select',placeholder:'请选择业务管理组人员',showSearch:true},
      {label:'操作状态',kind:'select',placeholder:'请选择'},
      {label:'提交情况',kind:'select',placeholder:'请选择'},
    ],tabs:[],title:'还车应结款列表',
  },
} as const;

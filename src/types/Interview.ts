export type InterviewQuestion = {
  id: string
  activity: string
  question: string
  functionId: string
  functionName: string
  subprocessId: string
  subprocessName: string
  roleId: string
  roleName: string
  contextId: string
  contextName: string
  personRoleId: string
}

export type InterviewAnswer = {
  questionId: string
  answer: number | ''
}

export type PointAllocation = {
  points: number
  activity: string
  question: string
  answer: number
  questionId: string
  functionId: string
  functionName: string
  subprocessId: string
  subprocessName: string
  roleId: string
  roleName: string
  contextId: string
  contextName: string
  personRoleId: string
  isOtherRole: boolean
}

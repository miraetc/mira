import IAppwrite from './Appwrite'

export default interface IProject extends IAppwrite {
  number: string
  category: string
  details?: string
  additional?: string
  title: string
  body: string
  date: string
  client: string
  image_id: string
  user_id?: string
}

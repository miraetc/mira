import { zodResolver } from '@hookform/resolvers/zod'
import { Dispatch, FC, FormEvent, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { databases, storage } from '@/lib/appwrite_client'
import { AppwriteException, ID } from 'appwrite'
import { projectSchema } from '@/lib/validation/project'
import { z } from 'zod'
import RichText from './RitchText'
import DOMPurify from 'dompurify'
import IProject from '@/models/Project'
import { CircleX, RotateCw } from 'lucide-react'

type Props = {
  userId?: string
  getProjects?: () => void
  setIsNewProjectOpen?: Dispatch<SetStateAction<boolean>>
  nextProjectNumber?: number
  project?: IProject
  setIsEditingProject?: Dispatch<SetStateAction<boolean>>
}

const NewProject: FC<Props> = ({
  userId,
  getProjects,
  setIsNewProjectOpen,
  nextProjectNumber,
  project,
  setIsEditingProject
}) => {
  const [file, setFile] = useState<File | undefined>()
  const [isLoadingNewProject, setIsLoadingNewProject] = useState<boolean>(false)
  const [filePreview, setFilePreview] = useState<string | ArrayBuffer | null>()
  const [submitError, setSubmitError] = useState<string>('')

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      number: project?.number || nextProjectNumber,
      category: project?.category || '',
      title: project?.title || '',
      details: project?.details || '',
      additional: project?.additional || '',
      body: project?.body || '',
      date: project?.date || '',
      client: project?.client || '',
      user_id: project?.user_id || userId,
      image_id: project?.image_id || '',
      file: undefined
    }
  })

  const fileRef = form.register('file')

  const onChangeImage = (e: FormEvent<HTMLInputElement>) => {
    const target = e?.target as HTMLInputElement & {
      files: FileList
    }
    setFile(target.files[0])

    const file = new FileReader()
    file.onload = () => {
      setFilePreview(file.result)
    }

    file.readAsDataURL(target.files[0])
  }

  const uploadImage = async () => {
    try {
      if (file) {
        return await storage.createFile(
          import.meta.env.VITE_IMAGE_BUCKET as string,
          ID.unique(),
          file
        )
      } else {
        throw new Error('Arquivo não carregado')
      }
    } catch (error) {
      throw new Error('Erro no upload da imagem')
    }
  }

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    try {
      setIsLoadingNewProject(true)
      setSubmitError('')
      const imageResponse = await uploadImage()

      if (typeof imageResponse === 'undefined') {
        throw new Error('Upload de imagem falhou')
      }

      delete values.file
      const project = {
        ...values,
        image_id: imageResponse.$id,
        body: DOMPurify.sanitize(values.body),
        title: DOMPurify.sanitize(values.title)
      }

      await databases.createDocument(
        import.meta.env.VITE_DATABASE_ID as string,
        import.meta.env.VITE_COLLECTION_ID_PROJECTS as string,
        ID.unique(),
        project
      )

      form.reset()
      getProjects && getProjects()
      setIsLoadingNewProject(false)
      setIsNewProjectOpen && setIsNewProjectOpen(false)
    } catch (error) {
      if (error instanceof AppwriteException) {
        setSubmitError(error.message)
      } else {
        setSubmitError('Erro genérico, favor contactar o administrador')
      }
      setIsLoadingNewProject(false)
    }
  }
  /*
   *   const clearImage = () => {
   *     setFile(undefined);
   *     setFilePreview(undefined);
   *   };
   *  */
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="new-project gap-y-2 lg:gap-y-0"
      >
        <div className="[grid-area:number] pr-2">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº</FormLabel>
                <FormControl>
                  <Input
                    className="pl-[6px] pr-0 lg:px-3"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="[grid-area:category] w-full lg:pr-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="[grid-area:divider] w-full h-4 border-b border-foreground lg:hidden" />
        <>
          <div className="[grid-area:details] w-full lg:pr-2">
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="[grid-area:additional] w-full lg:pr-2">
            <FormField
              control={form.control}
              name="additional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
        <div className="[grid-area:title] w-full lg:mb-4 lg:pr-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <RichText
                    oneLine
                    className="max-h-[37.5px]"
                    {...field}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="[grid-area:body] w-full lg:pr-2">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Corpo</FormLabel>
                <FormControl>
                  <RichText
                    value={field.value}
                    onChange={field.onChange}
                    className="min-h-[150px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="[grid-area:image] flex lg:block w-full items-end">
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Imagem</FormLabel>
                <FormControl>
                  <Input
                    className="file:text-foreground"
                    id="uploader"
                    type="file"
                    {...fileRef}
                    onChange={e => field.onChange(onChangeImage(e))}
                    accept="image/png, image/webp, image/jpg, image/jpeg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {filePreview ? (
            <img
              alt="Preview da imagem"
              src={filePreview as string}
              className="max-w-[150px] lg:max-h-[100px] ml-2 lg:ml-0 lg:mt-2 object-contain"
            />
          ) : null}
        </div>
        <div className="[grid-area:client] w-full">
          <FormField
            control={form.control}
            name="client"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="[grid-area:date] justify-self-end text-end pl-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input className="px-[3px] lg:px-3" type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="hidden" {...field} value={userId} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="[grid-area:buttons] flex flex-col w-full self-end justify-end">
          {submitError && (
            <p className="text-end text-destructive text-sm">
              Erro: {submitError}
            </p>
          )}
          {setIsEditingProject ? (
            <div className="space-x-2 lg:space-x-0 lg:space-y-2 w-full lg:flex flex-col lg:items-end justify-end">
              <Button isLoading={isLoadingNewProject} type="submit">
                <RotateCw className="mr-1" />
                Atualizar
              </Button>
              <Button
                onClick={() => setIsEditingProject(false)}
                variant="destructive"
              >
                <CircleX className="mr-1" />
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              isLoading={isLoadingNewProject}
              type="submit"
            >
              Enviar
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}

export default NewProject

import { databases } from '@/lib/appwrite_client'
import {
  Dispatch,
  FC,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  /* FormLabel, */
  FormMessage
} from '@/components/ui/form'
import { Button } from './ui/button'
import { AppwriteException, Models } from 'appwrite'
import MiraLogo from './icon/MiraLogo'
import { bioSchema } from '@/lib/validation/bio'
import RichText from './RitchText'
import DOMPurify from 'dompurify'

type Props = {
  userId: string | undefined
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

interface Bio {
  bio: string
}

const SliderBio: FC<Props> = ({ userId, isOpen, setIsOpen }) => {
  const [bioText, setBioText] = useState<string>('')
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState<boolean>(false)

  const bioRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)

  useLayoutEffect(() => {
    if (bioRef && bioRef.current) bioRef.current.innerHTML = bioText
  })

  const form = useForm<z.infer<typeof bioSchema>>({
    resolver: zodResolver(bioSchema),
    defaultValues: async () => getBio()
  })

  const getBio = async (): Promise<Bio> => {
    try {
      const response = await databases.getDocument(
        import.meta.env.VITE_DATABASE_ID as string,
        import.meta.env.VITE_COLLECTION_ID_BIO as string,
        import.meta.env.VITE_DOCUMENT_ID_BIO as string
      )
      setBioText(response.bio as string)

      return response as Models.Document & Bio
    } catch (error) {
      const err = 'Erro ao recuperar o texto da bio'
      setBioText(err)
      console.log(err + ':', error)
      return { bio: '' }
    }
  }

  const onSubmit = async (values: z.infer<typeof bioSchema>) => {
    try {
      setIsLoadingSubmission(true)
      const response = await databases.updateDocument(
        import.meta.env.VITE_DATABASE_ID as string,
        import.meta.env.VITE_COLLECTION_ID_BIO as string,
        import.meta.env.VITE_DOCUMENT_ID_BIO as string,
        {
          bio: DOMPurify.sanitize(values.bio)
        }
      )

      setBioText(response.bio as string)
      setIsEditingBio(false)
      setIsLoadingSubmission(false)
    } catch (error) {
      if (error instanceof AppwriteException) {
        form.setError('bio', {
          type: 'manual',
          message: error.message
        })
      } else {
        form.setError('bio', {
          type: 'manual',
          message: 'Erro genérico, favor contactar o administrador'
        })
      }
      setIsLoadingSubmission(false)
    }
  }

  const onCloseSlider = () => {
    setIsOpen(isOpen => !isOpen)
    /* setIsEditingBio(false); */
  }

  return (
    <aside
      className={`${
        isOpen ? 'grid' : 'hidden'
      } z-10 font-sans absolute left-0 text-background bg-foreground w-full slider-bio overflow-y-hidden`}
    >
      <div className="PADDING" />
      <div className="DUMMY" />
      <div className="bg-foreground pt-3 md:pt-4 pr-4 md:pr-7 space-y-6 overflow-y-scroll md:overflow-y-auto">
        <header
          className="flex justify-between items-start cursor-pointer"
          onClick={onCloseSlider}
        >
          <div className="w-[20px]">
            <MiraLogo className="fill-background" />
          </div>
        </header>
        {isEditingBio ? (
          <Form {...form}>
            <form
              className="flex flex-col mb-12 text-foreground"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormControl>
                      <RichText
                        className="w-full"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  className="self-end bg-foreground text-background border-background w-1/4"
                  variant="outline"
                  onClick={() => setIsEditingBio(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="text-foreground self-end w-1/4 ml-3"
                  variant="outline"
                  type="submit"
                  isLoading={isLoadingSubmission}
                >
                  Enviar
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col">
            <div ref={bioRef} />

            {userId ? (
              <Button
                variant="outline"
                className="text-foreground self-end"
                onClick={() => setIsEditingBio(true)}
              >
                Editar
              </Button>
            ) : null}
          </div>
        )}
        <div className="pb-10">
          <a href="mailto:deborah@mira.etc.br">deborah@mira.etc.br</a>
        </div>
      </div>
      <div className="CLOSE" onClick={onCloseSlider}></div>
    </aside>
  )
}

export default SliderBio

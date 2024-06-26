import {
  FC,
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  Dispatch,
  SetStateAction
} from 'react'
import IProject from '../models/Project'
import { databases, storage } from '@/lib/appwrite_client'
import { Button } from './ui/button'
import Trash from './icon/Trash'
import PencilSquare from './icon/PencilSquare'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import NewProject from './NewProject'
import deleteImage from '@/lib/deleteImage'

type Props = {
  project: IProject
  userId?: string
  getProjects: () => Promise<void>
}

type DeleteProps = {
  action: () => Promise<void>
  isDeleting: boolean
}

type ReadonlyProjectProps = {
  project: IProject
  userId?: string
  getProjects: () => Promise<void>
  setIsEditingProject: Dispatch<SetStateAction<boolean>>
  isProjectOpen: boolean
  setIsProjectOpen: Dispatch<SetStateAction<boolean>>
}

const DeletionAlert: FC<DeleteProps> = ({ action, isDeleting }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button isLoading={isDeleting} className="w-28" variant="destructive">
          <Trash />
          Apagar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="font-sans">
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar projeto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive"
            onClick={() => action()}
          >
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const ReadonlyProject: FC<ReadonlyProjectProps> = ({
  project,
  userId,
  getProjects,
  setIsEditingProject,
  isProjectOpen,
  setIsProjectOpen
}) => {
  const [imagePath, setImagePath] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string>('')

  const bodyRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const titleRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)

  useEffect(() => {
    getImage()
  })

  useLayoutEffect(() => {
    if (titleRef && titleRef.current) titleRef.current.innerHTML = project.title
    if (bodyRef && bodyRef.current) bodyRef.current.innerHTML = project.body
  })

  const getImage = () => {
    const result = storage.getFileView(
      import.meta.env.VITE_IMAGE_BUCKET as string,
      project.image_id
    )

    setImagePath(result.href)
  }

  const opener = () => setIsProjectOpen(prevState => !prevState)

  const deleteProject = async () => {
    try {
      setIsDeleting(true)
      setDeleteError('')

      const deleteImageRes = await deleteImage(project.image_id)

      if (deleteImageRes.success) {
        await databases.deleteDocument(
          import.meta.env.VITE_DATABASE_ID as string,
          import.meta.env.VITE_COLLECTION_ID_PROJECTS as string,
          project.$id
        )
        await getProjects()
      } else {
        setIsDeleting(false)
        setDeleteError(deleteImageRes.message)
      }
    } catch (error) {
      setIsDeleting(false)
      setDeleteError('Erro ao deletar projeto')
      console.log('Erro ao deletar projeto:', error)
    }
  }

  return (
    <>
      {isProjectOpen && (
        <>
          <div
            className="[grid-area:divider] cursor-pointer w-full h-4 border-b border-foreground lg:hidden"
            onClick={opener}
          />
          <div className="[grid-area:details] mb-6 lg:mb-0">
            {project.details}
          </div>
          <div className="[grid-area:additional] mb-6">
            {project.additional}
          </div>
          <div className="[grid-area:body] mb-6 lg:pr-2" ref={bodyRef} />
          <div className="[grid-area:image] mb-6 lg:mb-0 lg:pr-2">
            <img alt={project.title} src={imagePath} />
          </div>
          {userId ? (
            <div className="[grid-area:buttons] space-x-2 lg:space-x-0 lg:space-y-2 w-full lg:flex flex-col lg:items-end justify-end">
              {deleteError && (
                <p className="text-destructive text-sm mb-0">{deleteError}</p>
              )}
              <Button
                onClick={() => setIsEditingProject(true)}
                className="w-28"
              >
                <PencilSquare />
                Editar
              </Button>
              <DeletionAlert action={deleteProject} isDeleting={isDeleting} />
            </div>
          ) : null}
        </>
      )}

      <div
        className="[grid-area:empty] accordionTitleBar justify-self-end text-end"
        onClick={opener}
      >
        {userId ? project.number : null}
      </div>
      <div className="[grid-area:category] accordionTitleBar" onClick={opener}>
        {project.category}
      </div>
      <div
        className="[grid-area:title] accordionTitleBar md:mb-4"
        onClick={opener}
        ref={titleRef}
      />
      <div className="[grid-area:client] accordionTitleBar" onClick={opener}>
        {project.client}
      </div>
      <div className="[grid-area:date] accordionTitleBar" onClick={opener}>
        {project.date}
      </div>
    </>
  )
}

const ProjectAccordion: FC<Props> = ({ project, userId, getProjects }) => {
  const [isProjectOpen, setIsProjectOpen] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)

  return isEditingProject ? (
    <div className="border-t px-[5px]">
      <NewProject
        project={project}
        setIsEditingProject={setIsEditingProject}
        getProjects={getProjects}
      />
    </div>
  ) : (
    <div className="project border-t border-foreground px-[5px]">
      <ReadonlyProject
        project={project}
        userId={userId}
        getProjects={getProjects}
        setIsEditingProject={setIsEditingProject}
        isProjectOpen={isProjectOpen}
        setIsProjectOpen={setIsProjectOpen}
      />
    </div>
  )
}

export default ProjectAccordion

export interface ParliamentarianDTO {
  id: string
  userId: string
  name: string
  party?: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface PropositionDTO {
  id: string
  authorId: string
  title: string
  description: string
  status: string
  pollId?: string
  createdAt: string
  updatedAt: string
}

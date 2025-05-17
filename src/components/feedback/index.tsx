import Rate from './rate'
import Comment from './comment'

function Feedback() {
  return (
    <div className='flex flex-row items-center justify-center gap-x-2' >
        <Rate/>
        <Comment/>
    </div>
  )
}

export default Feedback
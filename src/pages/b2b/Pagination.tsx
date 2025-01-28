import toast from "react-hot-toast";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";

export function PaginationContainer() {
  return (
    <Pagination>
      <PaginationContent className="">
        <PaginationItem>
          <PaginationPrevious href="" className="font-body" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            href=""
            isActive
            onClick={() => toast.success("Page 2 loaded")}
            className="font-body"
          >
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

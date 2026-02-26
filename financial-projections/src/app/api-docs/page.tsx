import ReactSwagger from '@/components/ReactSwagger';

export default function ApiDocsPage() {
  return (
    <section className="container mx-auto py-8">
      <ReactSwagger specUrl="/api/openapi" />
    </section>
  );
}

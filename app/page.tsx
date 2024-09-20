import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";

const Home = () => {

  return (
    <div className="flex h-screen max-h-screen">

      <section className="remove-scrollbar container my-auto">
        <div className="sub-container max-w-[496px]">


          <LoginForm />

          <div className="text-14-regular mt-20 flex justify-between">
            <p className="justify-items-end text-dark-600 xl:text-left">
            </p>
          </div>
        </div>
      </section>

      <Image
        src="/assets/images/login3.png"
        height={1000}
        width={1000}
        alt="patient"
        className="side-img max-w-[50%]"
      />
    </div>
  );
};

export default Home;